import styled from '@emotion/styled'
import { isAddress } from 'ethers/lib/utils'
import { useEffect, useState } from 'react'
import { RotatingLines } from 'react-loader-spinner'
import { chain, useNetwork, useSigner } from 'wagmi'

import NftDetails from '../components/NftDetails'
import Input from '../components/TextInput'
import { getFactoryContract, VERIFIER_GOERLI } from '../contracts'
import { colors } from '../styles/colors'
import { NftDetails as NftDetailsType } from '../types'

export default function NewVault() {
  const { data: signer, isLoading: isSignerLoading } = useSigner()
  const chainId = useNetwork().chain ?? chain.goerli

  const [form, setForm] = useState({
    title: '',
    nftContractAddress: '',
  })

  const [nftDetails, setNftDetails] = useState<NftDetailsType | null>(null)
  const [nftDetailsLoading, setNftDetailsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const onFormChange = (field: string) => (e: any) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }))
  }

  useEffect(() => {
    if (!isAddress(form.nftContractAddress)) {
      setNftDetails(null)
      return
    }

    async function fetchNftDetails() {
      try {
        setNftDetailsLoading(true)

        const res = await fetch(
          `https://api.melo.cafe/collection?address=${form.nftContractAddress}&chainId=${chainId.id}`
        )
        const details = await res.json()
        setNftDetails(details.collection)
      } catch (e) {
        // TODO: handle error??
      }
      setNftDetailsLoading(false)
    }

    fetchNftDetails()
  }, [form.nftContractAddress])

  if (!signer && !isSignerLoading)
    return (
      <div className="w-full h-full min-h-screen flex flex-col" style={{ paddingLeft: '48px', paddingRight: '48px' }}>
        Please connect your address to continue 😎
      </div>
    )

  if (!signer) return null

  const submitDisabled = !form.title || !nftDetails || nftDetails.type === 'UNKNOWN' || submitting
  const contract = getFactoryContract(signer)

  const onSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await contract.createVault(form.title, form.nftContractAddress, VERIFIER_GOERLI)
      await res.wait()
    } catch (e) {
      // TODO: handle erro
    }

    setSubmitting(false)
  }

  return (
    <div className="w-full h-full min-h-screen flex flex-col" style={{ paddingLeft: '48px', paddingRight: '48px' }}>
      <FormContainer>
        <Title>New vault</Title>
        <div>
          Vault name:
          <Input type="input" placeholder="Cool cat vault" value={form.title} onChange={onFormChange('title')} />
        </div>
        <div>
          This vault is for owners of this NFT collection:
          <Input
            type="input"
            placeholder="0x123..."
            value={form.nftContractAddress}
            onChange={onFormChange('nftContractAddress')}
            label={
              <RotatingLines
                visible={nftDetailsLoading}
                strokeColor={colors.green400}
                strokeWidth="5"
                animationDuration="0.75"
                width="25"
              />
            }
          />
        </div>
        {nftDetails && <NftDetails details={nftDetails} />}
        <Submit disabled={submitDisabled} onClick={onSubmit}>
          Submit{' '}
          {submitting && (
            <RotatingLines
              visible={nftDetailsLoading}
              strokeColor={colors.green400}
              strokeWidth="5"
              animationDuration="0.75"
              width="25"
            />
          )}
        </Submit>
      </FormContainer>
    </div>
  )
}

const Title = styled.div`
  font-size: 24px;
  font-weight: 500;
`

const FormContainer = styled.div`
  display: flex;
  flex-flow: column;
  align-items: stretch;
  align-self: center;
  gap: 12px;
  max-width: 500px;
  width: 60%;
  color: ${colors.green400};
  padding-bottom: 64px;

  > div {
    display: flex;
    flex-flow: column;
    &::selection {
      background: ${colors.green300};
    }
  }

  @media only screen and (max-width: 900px) {
    width: 90%;
  }
`

const Submit = styled.button`
  margin-top: 12px;
  background-color: ${colors.yellow100};
  padding: 12px;
  border-radius: 25px;
  text-align: center;
  border: 3px solid ${colors.yellow400};
  font-weight: 600;
  font-size: 24px;

  &:disabled {
    background-color: ${colors.gray100};
    border: 3px solid ${colors.gray300};
    color: ${colors.gray400};
  }

  &:disabled:hover {
    transform: none;
  }

  &:hover {
    transform: scale(1.05);
    transition-duration: 0.2s;
  }

  transition-duration: 0.2s;
`

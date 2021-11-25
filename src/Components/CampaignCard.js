import React, { useState } from 'react'
import { CampaignABI } from './../contracts/Campaign'
import { useMoralis } from 'react-moralis'
import { Card, Input, Button } from 'antd'
const { Meta } = Card;

export const CampaignCard = ({ data }) => {

    const { user, web3 } = useMoralis();
    const [donationAmount, setDonationAmount] = useState("0.01")
    const [submitLoading, setSubmitLoading] = useState(false)

    const instanciateContract = () => {
        let contract = new web3.eth.Contract(CampaignABI, data.attributes.contractAddress)
        contract.setProvider(web3.currentProvider);
        return contract
    }

    const getCountdown = () => {
        const running = (new Date() - data.attributes.createdAt) / 1000
        const countdown = data.attributes.campaignDuration - running
        return parseFloat(countdown / 60).toFixed(1)
    }

    const handleDonation = async () => {
        setSubmitLoading(true)
        let campaign = instanciateContract()
        console.log(data.attributes)
        campaign.options.address = data.attributes.contractAddress
        await campaign.methods.donate().send({
            from: user.get("ethAddress"),
            value: web3.utils.toWei(donationAmount, 'ether')
        })
        setSubmitLoading(false)

    }

    return (
        <Card
            style={{ width: 500 }}
            cover={<img alt="nft" src={data.attributes.imageUrl} />}
            actions={[
                <Input.Group compact>
                    <Input style={{ width: 'calc(100% - 200px)' }} value={donationAmount} onChange={(e) => setDonationAmount(e.target.value)} />
                    <Button
                        type="primary"
                        onClick={handleDonation}
                        loading={submitLoading}
                    >Donate</Button>
                </Input.Group>
            ]}
        >
            {console.log("donationAmount", donationAmount)}
            <Meta
                title={data.attributes.cause}
                description={<>
                    <p>Countdown: {getCountdown()} Min.</p>
                    <p>Receipient: {data.attributes.receipientAddress}</p>
                    <p>Contract: {data.attributes.contractAddress}</p>
                    <p>Meta: {data.attributes.metadataUrl}</p>
                </>
                }
            />

        </Card>
    )
}
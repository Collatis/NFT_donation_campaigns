import React, { useState } from 'react'
import { CampaignABI, CampaignBytes } from './../contracts/Campaign'
import { useMoralis, useNewMoralisObject } from 'react-moralis'
import { Button, Input, Form, Upload, message, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
const { TextArea } = Input

export const CreateCampaignCard = () => {
    const [form] = Form.useForm()
    const { Moralis, user, web3 } = useMoralis();
    const { save: saveCampaign } = useNewMoralisObject("Campaign")
    let [showContractMask, setShowContractMask] = useState(false)
    let [submitLoading, setSubmitLoading] = useState(false)
    let [NFTFiles, setNFTFiles] = useState([])

    const getId = (length) => {
        let res = ''
        var numbers = '0123456789';
        var numbersLength = numbers.length;
        for (let i = 0; i < length; i++) {
            res += numbers.charAt(Math.floor(Math.random() *
                numbersLength));
        }
        return res;
    }

    const instanciateContract = () => {
        let contract = new web3.eth.Contract(CampaignABI)
        contract.setProvider(web3.currentProvider);
        return contract
    }

    const daysToSeconds = (days) => {
        const seconds = parseFloat(days) * 60 * 60 * 24
        return seconds.toString()
    }

    const handleSubmit = async ({ cause, description, duration, goal, receipient }) => {
        setSubmitLoading(true)
        try {
            let paddedHex = getId(64)

            // upload the png
            const moralisFile = new Moralis.File(`${paddedHex}.png`,
                NFTFiles[0].originFileObj, "image/png")
            await moralisFile.saveIPFS()
            let image_url = moralisFile._ipfs

            // upload metadata
            const metadata = {
                name: cause,
                description: description,
                image: image_url
            }
            const metaDataFile = new Moralis.File(
                `${paddedHex}.json`,
                { base64: btoa(unescape(encodeURIComponent(JSON.stringify(metadata)))) })
            await metaDataFile.saveIPFS()
            let meta_url = metaDataFile._ipfs

            // deploy contract
            var contract = instanciateContract()
            web3.eth.defaultAccount = user.get("ethAddress")
            const instance = await contract.deploy({
                data: CampaignBytes,
                arguments: [daysToSeconds(duration), receipient, goal, paddedHex, meta_url]
            }).send({
                from: user.get("ethAddress"),
            })


            saveCampaign({
                userAddress: user.get('ethAddress'),
                receipientAddress: receipient,
                contractAddress: instance._address,
                cause,
                description,
                campaignDuration: daysToSeconds(duration),
                campaignGoal: goal,
                nftId: paddedHex,
                metadataUrl: meta_url,
                imageUrl: image_url
            })
        } catch (error) {
            message.error("Somthing went wrong sorry :(")
            console.log(error)
            setNFTFiles([])
        }

        setSubmitLoading(false)
        setShowContractMask(false)
        form.resetFields()
        setNFTFiles([])
    }

    return (
        <>

            <Button
                centered={true}
                type="primary"
                onClick={() => setShowContractMask(true)}
            > Create Campaign </Button>
            <Modal
                title="Create a Campaign"
                visible={showContractMask}
                footer={[
                    <Button >Cancel </Button>,
                    <Button type={"primary"} form="createCampaignForm" htmlType="submit" loading={submitLoading}>Ok</Button>
                ]}
                onCancel={() => setShowContractMask(false)}
                width={1000}
            >
                <Form
                    form={form}
                    id="createCampaignForm"
                    name="basic"
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    initialValues={{ remember: true }}
                    onFinish={handleSubmit}
                    autoComplete="off"
                >
                    <Form.Item
                        label="Campaign Title"
                        name="cause"
                        rules={[{ required: true, message: 'Please input the cause of the Campaign!' }]}>
                        <Input placeholder="Describe your campaign in a short Title" />
                    </Form.Item>
                    <Form.Item
                        label="Descriptions"
                        name="description"
                        rules={[{ required: true, message: 'Please input your description!' }]}>
                        <TextArea placeholder="Describe the details of your campaign here." />
                    </Form.Item>
                    <Form.Item
                        rules={[{ required: true, message: 'Please input the receipient!' }]}
                        label="Set the Adress of the Receipient"
                        name="receipient">
                        <Input placeholder="Ethereum Adress" />
                    </Form.Item>
                    <Form.Item
                        rules={[{ required: true, message: 'Please input your goal!' }]}
                        label="Set the Fianancial Goal of the Campaign"
                        name="goal">
                        <Input placeholder="Dollars" />
                    </Form.Item>
                    <Form.Item
                        rules={[{ required: true, message: 'Please input the duration!' }]}
                        label="Set the Duration of the campaign"
                        name="duration" >
                        <Input placeholder="Days" />
                    </Form.Item>
                    <Form.Item
                        rules={[{ required: true, message: 'Please input your png!' }]}
                        label="Upload png for your NFT"
                        name="png">
                        <Upload
                            listType="picture-card"
                            onChange={(uploader) => setNFTFiles(uploader.fileList)}
                            beforeUpload
                            accept={[".png", ".gif"]}
                        >
                            {NFTFiles.length < 1 && <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>Upload</div>
                            </div>}
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>

        </>
    )
}
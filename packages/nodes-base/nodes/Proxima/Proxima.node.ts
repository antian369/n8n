import {
    IExecuteFunctions,
} from 'n8n-core';

import {
    IDataObject,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';

import {
    OptionsWithUri,
} from 'request';

export class Proxima implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Proxima',
        name: 'proxima',
        // icon: 'file:proxima.svg',
        group: ['transform'],
        version: 1,
        description: 'Consume Proxima API',
        defaults: {
            name: 'Proxima',
            color: '#1A82e2',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'proximaApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'ID',
                name: 'id',
                type: 'string',
                required: true,
                default: '',
                description: 'ID',
            },
            {
                displayName: '字段',
                name: 'field',
                type: 'options',
                options: [
                    {
                        name: '名称',
                        value: 'name',
                    },
                ],
                default: 'name',
                required: true,
                description: '某一个字段',
            },
            {
                displayName: '值',
                name: 'fieldValue',
                type: 'string',
                required: true,
                default: '',
                description: '字段的值',
            }
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        let responseData;
        const id = this.getNodeParameter('id', 0) as string;
        const field = this.getNodeParameter('field', 0) as string;
        const fieldValue = this.getNodeParameter('fieldValue', 0) as string;
        //Get credentials the user provided for this node
        const credentials = this.getCredentials('proximaApi') as IDataObject;

        // get additional fields input
        // const additionalFields = this.getNodeParameter('additionalFields', 0) as IDataObject;
        // const data: IDataObject = {
        //     email,
        // };

        // Object.assign(data, additionalFields);

        //基础的http option
        const baseOption: OptionsWithUri = {
            headers: {
                'Accept': 'application/json',
            },
            timeout: 30000,
            uri: '',
            json: true,
        }
        if (baseOption.headers) {
            baseOption.headers[credentials.tokenKey as string] = credentials.tokenValue
        }
        const baseUrl = credentials.baseUrl



        try {
            // 1.查询卡片数据
            const uri = `${baseUrl}/parse/classes/Item/${id}`
            const getOptions: OptionsWithUri = Object.assign({}, baseOption, { uri })
            console.debug('get item options:', getOptions)

            let item = await this.helpers.request(getOptions);
            console.debug(`item : ${id} `, item)

            // 2.更新卡片数据
            item.name = fieldValue

            const putOptions: OptionsWithUri = Object.assign({}, baseOption, {
                method: 'PUT',
                body: item,
                uri,
            });
            console.debug('put item options:', getOptions)

            responseData = await this.helpers.request(putOptions);

            // Map data to n8n data
            return [this.helpers.returnJsonArray(responseData)];
        } catch (e) {
            console.error('Proxima.node error:', e.message)
            return [this.helpers.returnJsonArray({ message: e.message })];
        }
    }
}
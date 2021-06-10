import {
    IExecuteFunctions,
} from 'n8n-core';

import {
    IDataObject,
    ILoadOptionsFunctions,
    INodeExecutionData,
    INodePropertyOptions,
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
                displayName: '对象',
                name: 'opsObject',
                type: 'options',
                options: [
                    {
                        name: '卡片',
                        value: 'card',
                    },
                    {
                        name: '工作流',
                        value: 'bpmn',
                    },
                    {
                        name: '其它',
                        value: 'other',
                    },
                ],
                default: 'card',
                required: true,
                description: '操作对象',
            },
            // 卡片操作，选择卡片时显示
            {
                displayName: '操作',
                name: 'cardOps',
                type: 'options',
                displayOptions: {
                    show: {
                        opsObject: [
                            'card',
                        ],
                    },
                },
                options: [
                    {
                        name: '更新字段',
                        value: 'update',
                    },
                    {
                        name: '创建卡片',
                        value: 'create',
                    },
                    {
                        name: '创建子卡片',
                        value: 'createChild',
                    },
                ],
                default: 'update',
                required: true,
                description: '卡片操作',
            },
            // 工作流操作，选择工作流时显示
            {
                displayName: '操作',
                name: 'bpmnOps',
                type: 'options',
                displayOptions: {
                    show: {
                        opsObject: [
                            'bpmn',
                        ],
                    },
                },
                options: [
                    {
                        name: '推进工作流',
                        value: 'next',
                    },
                    {
                        name: '创建工作流',
                        value: 'create',
                    },
                    {
                        name: '更新工作流字段',
                        value: 'update',
                    },
                ],
                default: 'next',
                required: true,
                description: '工作流操作',
            },
            // 其它操作，选择其它时显示
            {
                displayName: '操作',
                name: 'otherOps',
                type: 'options',
                displayOptions: {
                    show: {
                        opsObject: [
                            'other',
                        ],
                    },
                },
                options: [
                    {
                        name: '发送邮件',
                        value: 'sendMail',
                    },
                ],
                default: 'sendMail',
                required: true,
                description: '其它操作',
            },
            //卡片操作：更新字段、创建子卡片时显示
            {
                displayName: 'ID',
                name: 'id',
                type: 'string',
                displayOptions: {
                    show: {
                        opsObject: [
                            'card',
                        ],
                        cardOps: [
                            'update', 'createChild'
                        ]
                    },
                },
                default: '',
                description: 'ID',
            },
            {
                displayName: '卡片字段',
                name: 'cardFieldList',
                placeholder: '添加字段',
                type: 'fixedCollection',
                typeOptions: {
                    multipleValues: true,
                },
                displayOptions: {
                    show: {
                        opsObject: [
                            'card',
                        ],
                        cardOps: [
                            'update',
                        ]
                    },
                },
                description: '添加字段',
                default: {},
                options: [
                    {
                        name: 'field',
                        displayName: '字段',
                        values: [
                            {
                                displayName: 'Name',
                                name: 'name',
                                type: 'options',
                                default: '',
                                description: '字段名',
                                typeOptions: {
                                    loadOptionsMethod: 'getCustomField',
                                },
                            },
                            {
                                displayName: 'Value',
                                name: 'value',
                                type: 'string',
                                default: '',
                                description: '字段值',
                            },
                        ],
                    },
                ],
            },
        ],
    };

    methods = {
        loadOptions: {
            /**
             * 字段名下拉列表
             * @param this 
             * @returns 
             */
            async getCustomField(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
                const credentials = this.getCredentials('proximaApi') as IDataObject;
                const option: OptionsWithUri = {
                    headers: {
                        'Accept': 'application/json',
                    },
                    method: 'POST',
                    timeout: 30000,
                    uri: `${credentials.baseUrl}/connector/fields/options`,
                    json: true,
                }
                const responseData = await this.helpers.request!(option);
                return responseData!.payload!.values!.map((x: any) => ({
                    'name': x.label,
                    'value': x.value
                }));
            },
        }
    }

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        let responseData;
        const id = this.getNodeParameter('id', 0) as string;
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
        baseOption.headers![credentials.tokenKey as string] = credentials.tokenValue
        // if (baseOption.headers) {
        //     baseOption.headers[credentials.tokenKey as string] = credentials.tokenValue
        // }
        const baseUrl = credentials.baseUrl


        try {
            // 1.查询卡片数据
            const uri = `${baseUrl}/parse/classes/Item/${id}`
            const getOptions: OptionsWithUri = Object.assign({}, baseOption, { uri })

            let item = await this.helpers.request(getOptions);
            console.debug(`item : ${id} `, item)

            // 2.更新卡片数据
            const cardFieldList = this.getNodeParameter('cardFieldList', 0) as IDataObject;
            console.info('cardFieldList:', cardFieldList)
            if (cardFieldList.field !== undefined) {
                for (const fieldData of cardFieldList!.field as IDataObject[]) {
                    // key值按照 . 分割，按层级修改值
                    let keys = (fieldData!.name as string).split('.')
                    // 取出最后一层的key
                    let lastKey = keys.pop()
                    // 暂存每个层级的值
                    let itemTemp = item
                    if (lastKey) {
                        for (let k of keys) {
                            // 不存在时创建
                            if (! itemTemp[k]) {
                                itemTemp[k] = {}
                            }
                            itemTemp = itemTemp[k]
                        }
                        itemTemp[lastKey] = fieldData!.value
                    }
                }
            }

            const putOptions: OptionsWithUri = Object.assign({}, baseOption, {
                method: 'PUT',
                body: item,
                uri,
            });
            console.info('put item options:', putOptions)

            responseData = await this.helpers.request(putOptions);

            // Map data to n8n data
            return [this.helpers.returnJsonArray(responseData)];
        } catch (e) {
            console.error('Proxima.node error:', e.message)
            return [this.helpers.returnJsonArray({ message: e.message })];
        }
    }
}
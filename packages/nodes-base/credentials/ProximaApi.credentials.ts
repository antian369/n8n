import {
    ICredentialType,
    NodePropertyTypes,
} from 'n8n-workflow';

export class ProximaApi implements ICredentialType {
    name = 'proximaApi';
    displayName = 'Proxima API';
    documentationUrl = 'proxima';
    properties = [
        {
            displayName: 'Base Url',
            name: 'baseUrl',
            type: 'string' as NodePropertyTypes,
            default: '',
        },
        {
            displayName: 'Token Key',
            name: 'tokenKey',
            type: 'string' as NodePropertyTypes,
            default: '',
        },
        {
            displayName: 'Token Value',
            name: 'tokenValue',
            type: 'string' as NodePropertyTypes,
            default: '',
        },
    ];
}
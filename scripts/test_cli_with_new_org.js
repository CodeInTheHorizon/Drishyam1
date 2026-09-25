const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

function tryGetLocalCliCredentials() {
    const homedir = os.homedir();
    const baseDir = path.join(homedir, 'Library/Preferences/zcatalyst-cli-nodejs');
    const keyPath = path.join(baseDir, '.zcatalyst-cli-key');
    const configPath = path.join(baseDir, 'zcatalyst-cli-v1.json');
    
    const encryptionKey = fs.readFileSync(keyPath);
    const configRaw = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configRaw);
    
    const activeDc = config.active_dc || 'us';
    const dcConfig = config[activeDc];
    const encrypted = dcConfig.credential;
    const data = Buffer.from(encrypted, 'hex');
    const initializationVector = data.slice(0, 12);
    const authTag = data.slice(13, 29);
    const cipherText = data.slice(29);
    
    const derivedKey = crypto.pbkdf2Sync(encryptionKey, initializationVector, 100000, 32, 'sha512');
    const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, initializationVector);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
    const credObj = JSON.parse(decrypted.toString());
    
    return {
        dc: activeDc,
        clientId: '1000.D5IIHDXSPN2MII26AD0V61I6RMVSNM',
        clientSecret: '02ee875ecfc50573e5cc8d62916ad3077be20d0f42',
        refreshToken: credObj.token.slice(2)
    };
}

const localCreds = tryGetLocalCliCredentials();
if (localCreds) {
    process.env.X_ZOHO_CATALYST_CONSOLE_URL = 'https://api.catalyst.zoho.' + localCreds.dc;
    process.env.X_ZOHO_CATALYST_ACCOUNTS_URL = 'https://accounts.zoho.' + localCreds.dc;
    process.env.X_ZOHO_CATALYST_ORG_ID = '60077759371';
    
    const catalyst = require('zcatalyst-sdk-node');
    const app = catalyst.initializeApp({
        project_id: '56116000000017001',
        project_key: '56116000000017001',
        environment: 'Development',
        credential: catalyst.credential.refreshToken({
            client_id: localCreds.clientId,
            client_secret: localCreds.clientSecret,
            refresh_token: localCreds.refreshToken
        })
    });
    
    async function runTest() {
        console.log('Waiting 18 seconds for OAuth token propagation across Zoho cluster...');
        await new Promise(r => setTimeout(r, 18000));
        
        console.log('Testing Datastore Read with Org ID 60077759371...');
        try {
            const rows = await app.datastore().table('State').getAllRows();
            console.log('READ SUCCESS! Count:', rows ? rows.length : 0);
            if (rows && rows.length > 0) {
                console.log('Sample row:', rows[0]);
            }
            
            console.log('Testing Row Insert...');
            const newRow = await app.datastore().table('State').insertRow({
                StatelD: 101,
                StateName: 'Karnataka',
                NationalitylD: 1,
                Active: true
            });
            console.log('INSERT SUCCESS:', newRow);
        } catch (err) {
            console.error('ERROR!');
            console.error('Message:', err.message);
            console.error('Details:', JSON.stringify(err.response?.data || err.details || err, null, 2));
        }
    }
    
    runTest();
}

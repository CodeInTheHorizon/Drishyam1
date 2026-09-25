const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

function getCachedCliAccessToken() {
    const homedir = os.homedir();
    const baseDir = path.join(homedir, 'Library/Preferences/zcatalyst-cli-nodejs');
    const keyPath = path.join(baseDir, '.zcatalyst-cli-key');
    const configPath = path.join(baseDir, 'zcatalyst-cli-v1.json');
    
    if (fs.existsSync(keyPath) && fs.existsSync(configPath)) {
        const encryptionKey = fs.readFileSync(keyPath);
        const configRaw = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configRaw);
        
        const activeDc = config.active_dc || 'us';
        const dcConfig = config[activeDc];
        if (dcConfig && dcConfig.access_token) {
            console.log("Found cached access_token in CLI session config!");
            return dcConfig.access_token;
        }
        
        if (dcConfig && dcConfig.credential) {
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
            console.log("Decrypted credential keys:", Object.keys(credObj));
            if (credObj.access_token) {
                console.log("Found decrypted access_token!");
                return credObj.access_token;
            }
        }
    }
    return null;
}

getCachedCliAccessToken();

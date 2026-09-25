process.env.X_ZOHO_CATALYST_CONSOLE_URL = 'https://api.catalyst.zoho.in';
process.env.X_ZOHO_CATALYST_ACCOUNTS_URL = 'https://accounts.zoho.in';
process.env.X_ZOHO_CATALYST_ORG_ID = '60077759371';

const catalyst = require('zcatalyst-sdk-node');

const app = catalyst.initializeApp({
    project_id: '56116000000017001',
    project_key: '56116000000017001',
    environment: 'Development',
    credential: catalyst.credential.refreshToken({
        client_id: '1000.5MRGGGJP3OA261H0NYL03V82LDIYIW',
        client_secret: 'b6a267d67253a477706ec84342d19916b5f84e6401',
        refresh_token: '1000.baf75603ef65971da72a9c52b6d14e2d.6df9a5e1108c3564d60aefccac3c1b40'
    })
});

async function testConnection() {
    console.log("Testing Zoho Catalyst connection with new credentials...");
    try {
        const table = app.datastore().table('State');
        const rows = await table.getAllRows();
        console.log("SUCCESS! Retrieved rows count:", rows ? rows.length : 0);
        if (rows && rows.length > 0) {
            console.log("Sample row:", rows[0]);
        }
    } catch (err) {
        console.error("FAILED to connect or read table!");
        console.error("Message:", err.message);
        console.error("Details:", JSON.stringify(err.response?.data || err.details || err, null, 2));
    }
}

testConnection();

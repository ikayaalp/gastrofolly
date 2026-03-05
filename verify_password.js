const bcrypt = require('bcryptjs');

async function main() {
    const hash = '$2a$10$wE9m.H101oD1s2jcd9d5ejMsgukvFRbYSwmc5bDeIWraStfD05Ee';
    const match = await bcrypt.compare('Password123!', hash);
    console.log('Does Password123! match?', match);

    if (!match) {
        console.log('Generating new hash for Password123!...');
        const newHash = await bcrypt.hash('Password123!', 10);
        console.log('New hash:', newHash);
    }
}

main();

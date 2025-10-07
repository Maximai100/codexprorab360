// Скрипт для проверки подключения к Directus
const DIRECTUS_URL = 'https://1.cycloscope.online';
const DIRECTUS_TOKEN = '7JeEQ9bKtgX7onxJQZyGu8w8tCziiblV';

async function checkDirectus() {
    console.log('🔍 Проверка подключения к Directus...\n');
    console.log(`URL: ${DIRECTUS_URL}`);
    console.log(`Token: ${DIRECTUS_TOKEN.substring(0, 10)}...\n`);

    try {
        // Проверка доступности сервера
        console.log('1️⃣ Проверка доступности сервера...');
        const serverResponse = await fetch(`${DIRECTUS_URL}/server/info`);
        if (serverResponse.ok) {
            console.log('✅ Сервер доступен\n');
        } else {
            console.log('❌ Сервер недоступен\n');
            return;
        }

        // Проверка коллекции owners
        console.log('2️⃣ Проверка коллекции owners...');
        const ownersResponse = await fetch(`${DIRECTUS_URL}/items/owners`, {
            headers: {
                'Authorization': `Bearer ${DIRECTUS_TOKEN}`
            }
        });
        
        if (ownersResponse.ok) {
            const ownersData = await ownersResponse.json();
            console.log(`✅ Коллекция owners доступна (записей: ${ownersData.data?.length || 0})\n`);
        } else {
            const error = await ownersResponse.text();
            console.log(`❌ Ошибка доступа к коллекции owners: ${ownersResponse.status}`);
            console.log(`   ${error}\n`);
        }

        // Проверка коллекции projects
        console.log('3️⃣ Проверка коллекции projects...');
        const projectsResponse = await fetch(`${DIRECTUS_URL}/items/projects`, {
            headers: {
                'Authorization': `Bearer ${DIRECTUS_TOKEN}`
            }
        });
        
        if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json();
            console.log(`✅ Коллекция projects доступна (записей: ${projectsData.data?.length || 0})\n`);
        } else {
            const error = await projectsResponse.text();
            console.log(`❌ Ошибка доступа к коллекции projects: ${projectsResponse.status}`);
            console.log(`   ${error}\n`);
        }

        console.log('✨ Проверка завершена!');
        
    } catch (error) {
        console.error('❌ Ошибка при проверке:', error.message);
    }
}

checkDirectus();

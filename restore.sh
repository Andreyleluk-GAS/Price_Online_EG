#!/bin/bash

echo "========================================"
echo "🚀 НАЧИНАЕМ УМНОЕ ВОССТАНОВЛЕНИЕ СЕРВЕРА..."
echo "========================================"

# Шаг 1: Проверка и установка базовых программ
if ! command -v nginx &> /dev/null; then
    echo "1. Установка Nginx, Git, Curl..."
    apt update && apt install -y curl git nginx
else
    echo "1. ✅ Nginx и базовые пакеты уже установлены."
fi

# Шаг 2: Проверка и установка Node.js
if ! command -v node &> /dev/null; then
    echo "2. Установка Node.js (v20)..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    echo "2. ✅ Node.js уже установлен."
fi

# Шаг 3: Проверка и установка PM2
if ! command -v pm2 &> /dev/null; then
    echo "3. Установка PM2..."
    npm install -g pm2
    # Настраиваем автозапуск PM2 при перезагрузке сервера
    env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
else
    echo "3. ✅ PM2 уже установлен."
fi

# Шаг 4: Структура папок и SSH ключи
echo "4. Проверка папок и прав доступа..."
mkdir -p /root/frontend /root/backend
mkdir -p /root/.ssh
chmod 700 /root/.ssh

# Ищем наш ключ в файле. Если его там нет — добавляем.
if ! grep -q "github-actions" /root/.ssh/authorized_keys 2>/dev/null; then
    echo "   Вшиваем публичный SSH-ключ..."
    echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAII8QaZEfGMci3g0NuVM08mUHruZfsoBmT9GPJ5iacxpv github-actions" >> /root/.ssh/authorized_keys
    chmod 600 /root/.ssh/authorized_keys
else
    echo "   ✅ SSH-ключ уже на месте."
fi

# Шаг 5: Регистрация PM2 (с правильным именем файла server.js)
if ! pm2 describe gbo-api &> /dev/null; then
    echo "5. Подготовка процесса PM2 (gbo-api)..."
    cd /root/backend
    # Создаем файл-пустышку с твоим реальным названием, чтобы PM2 мог его зарегистрировать
    touch server.js
    pm2 start server.js --name gbo-api
    pm2 save
else
    echo "5. ✅ Процесс PM2 (gbo-api) уже зарегистрирован."
fi

# Шаг 6: Настройка Nginx и прав
if [ ! -f /etc/nginx/conf.d/elitegas.conf ]; then
    echo "6. Настройка Nginx и SSL..."
    cat > /etc/nginx/conf.d/elitegas.conf << 'EOF'
server {
    listen 80;
    server_name elitegas.stockcity.ru;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name elitegas.stockcity.ru;

    ssl_certificate /root/cert/elitegas.stockcity.ru/fullchain.pem;
    ssl_certificate_key /root/cert/elitegas.stockcity.ru/privkey.pem;

    root /root/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
    rm -f /etc/nginx/sites-enabled/default
    
    # Даем Nginx права заходить в папку /root
    sed -i 's/user www-data;/user root;/g' /etc/nginx/nginx.conf
    
    systemctl restart nginx
    systemctl enable nginx
else
    echo "6. ✅ Настройки Nginx уже применены."
fi

echo "========================================"
echo "✅ ВСЁ ГОТОВО!"
echo "========================================"
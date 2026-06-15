#!/bin/bash

echo "========================================"
echo "🚀 НАЧИНАЕМ ВОССТАНОВЛЕНИЕ СЕРВЕРА ELITEGAS..."
echo "========================================"

echo "1. Обновление системы и установка Nginx, Git, Curl..."
apt update && apt install -y curl git nginx

echo "2. Установка Node.js (v20)..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "3. Установка PM2 для бэкенда..."
npm install -g pm2

echo "4. Создание структуры папок и настройка ключей доступа..."
mkdir -p /root/frontend /root/backend
mkdir -p /root/.ssh
chmod 700 /root/.ssh

# Запись твоего публичного SSH-ключа для GitHub Actions
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAII8QaZEfGMci3g0NuVM08mUHruZfsoBmT9GPJ5iacxpv github-actions" > /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

echo "5. Настройка Nginx и SSL..."
cat > /etc/nginx/conf.d/elitegas.conf << 'EOF'
server {
    listen 80;
    server_name elitegas.stockcity.ru;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name elitegas.stockcity.ru;

    # Пути к сертификатам 3X-UI панели
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

# Удаляем дефолтную заглушку Nginx
rm -f /etc/nginx/sites-enabled/default

echo "6. Перезапуск веб-сервера..."
systemctl restart nginx
systemctl enable nginx

echo "========================================"
echo "✅ СЕРВЕР УСПЕШНО ПОДГОТОВЛЕН И НАСТРОЕН!"
echo "Теперь робот GitHub имеет полный доступ к серверу."
echo "========================================"
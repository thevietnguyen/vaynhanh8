# =============================
#  LOTTE Finance - Proxy Config
# =============================

# Main NGINX configuration
user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    keepalive_timeout  65;

    # =============================
    #  Server block configuration
    # =============================
    server {
        listen 80;
        server_name localhost;

        # Redirect HTTP -> HTTPS (optional)
        # return 301 https://$host$request_uri;

        # -----------------------------
        # Proxy for /vaynhanh8
        # -----------------------------
        location /vaynhanh8 {
            rewrite ^/vaynhanh8$ https://$host/$request_uri permanent;

            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-NginX-Proxy true;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_ssl_session_reuse off;
            proxy_set_header Host $http_host;
            proxy_pass_header Server;
            proxy_cache_bypass $http_upgrade;

            proxy_pass http://ldp-frontend-vay-clone08:8080/vaynhanh8;
        }

        # -----------------------------
        # Example: default location
        # -----------------------------
        location / {
            root   /usr/share/nginx/html;
            index  index.html index.htm;
        }

        # -----------------------------
        # Error page
        # -----------------------------
        error_page  500 502 503 504  /50x.html;
        location = /50x.html {
            root   /usr/share/nginx/html;
        }
    }
}

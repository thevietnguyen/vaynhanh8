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

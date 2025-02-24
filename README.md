# sentryC

## How to use

```sh
docker run -d \
  --name sentryC \
  -p 8970:8970 \
  -e DATABASE_URL="postgresql://user:pass@localhost:5432/sentry"
  --restart unless-stopped \
  ghcr.io/xg4/sentryC
```

# Environment variables

Copy `./.env.sample` to `./.env` end make sure all variables are set.

# Start server

```bash
npm ci
npm build
npm start
```

# Build image

```bash
docker build ./ -t frontendermagazine/article --label frontendermagazine
```
or
```bash
npm run build
```

# Publish

```bash
docker login
docker push frontendermagazine/article
```
or
```bash
docker login
npm run publish
```

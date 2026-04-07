# À faire après redémarrage

## 1. Réparer le cache npm (une seule fois)
```
sudo chown -R $(whoami) ~/.npm
```

## 2. Installer les dépendances manquantes
```
npm install react-markdown remark-gfm
```

## 3. Vérifier que ça marche
```
npm run build
```

Quand c'est fait, supprimer ce fichier.

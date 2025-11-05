# GitHub Repository Setup

El repositorio local "Friends and Family" está listo. Sigue estos pasos para conectarlo a GitHub:

## Paso 1: Crear el repositorio en GitHub

1. Ve a [GitHub](https://github.com) y crea un nuevo repositorio
2. Nombre del repositorio: `friends-and-family` (o `friends-and-family-discount-app`)
3. **NO inicialices** con README, .gitignore o licencia (ya los tenemos)
4. Copia la URL del repositorio (ej: `https://github.com/tu-usuario/friends-and-family.git`)

## Paso 2: Conectar el repositorio local

```bash
cd /Users/julianmartel/appointment/shopify-friends-family-app

# Agregar el remote (reemplaza con tu URL)
git remote add origin https://github.com/TU_USUARIO/friends-and-family.git

# Verificar que se agregó correctamente
git remote -v

# Hacer push del código
git push -u origin main
```

## Paso 3: Verificar

Después del push, deberías ver todos los archivos en tu repositorio de GitHub.

## Comandos útiles

```bash
# Ver el estado del repositorio
git status

# Ver los commits
git log --oneline

# Ver los remotes configurados
git remote -v

# Hacer cambios y commitear
git add .
git commit -m "Descripción del cambio"
git push
```

---

**Nota**: El archivo `.git/config` ya tiene un placeholder para el remote. Actualízalo con tu URL real o agrega el remote con el comando `git remote add`.


## Установка Bun

Проект требует **Bun** для разработки и сборки. Иструкция по установке есть на их сайте: https://bun.com/docs/installation

### macOS и Linux

Рекомендуемый способ через curl:
```
curl -fsSL https://bun.sh/install | bash
```

Альтернативные способы:
```
# Через npm (если уже установлен)
npm install -g bun

# Через Homebrew (macOS)
brew install oven-sh/bun/bun

# Через Docker
docker pull oven/bun
```

**Linux пользователи:** Убедитесь, что установлен пакет `unzip`[13]:
```
sudo apt install unzip  # Ubuntu/Debian
```

### Windows

Выберите один из способов:
```
# PowerShell (рекомендуется)
powershell -c "irm bun.sh/install.ps1|iex"

# Через npm
npm install -g bun

# Через Scoop
scoop install bun
```

### Проверка установки

После установки проверьте версию:
```
bun --version
```

Если команда не найдена, добавьте `~/.bun/bin` в PATH:
```
# Linux/Mac - добавьте в ~/.bashrc или ~/.zshrc
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

### Обновление
Bun может обновлять сам себя:
```
bun upgrade
```

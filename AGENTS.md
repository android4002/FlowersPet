# Инструкции для AI-агента (OpenCode)

## ПЕРВОЕ ДЕЙСТВИЕ В КАЖДОЙ СЕССИИ

Прочитать файл из Obsidian:
```bash
curl -sk -H "Authorization: Bearer 4cf1fc57ec1f72876cf14d5e2755ba7b8f7cc505b5aa4cc3caa8dab960d899d7" https://127.0.0.1:27124/vault/web_project_status.md
```
Этот файл содержит полную архитектуру, структуру файлов, API, историю багов и backlog.
НЕ сканировать проект заново если контекст уже есть в этом файле.

## ПОСЛЕДНЕЕ ДЕЙСТВИЕ В КАЖДОЙ СЕССИИ

Обновить `web_project_status.md` в Obsidian — добавить что изменилось:
```bash
# Читаем текущий файл
curl -sk -H "Authorization: Bearer 4cf1fc57ec1f72876cf14d5e2755ba7b8f7cc505b5aa4cc3caa8dab960d899d7" \
  https://127.0.0.1:27124/vault/web_project_status.md > /tmp/obs_status.md

# Дописываем лог и пишем обратно
curl -sk -X PUT \
  -H "Authorization: Bearer 4cf1fc57ec1f72876cf14d5e2755ba7b8f7cc505b5aa4cc3caa8dab960d899d7" \
  -H "Content-Type: text/markdown" \
  https://127.0.0.1:27124/vault/web_project_status.md \
  --data-binary @/tmp/obs_status.md
```

## ПРАВИЛА ЭКОНОМИИ ТОКЕНОВ

### Чтение кода
- Читать только файлы нужные для конкретной задачи
- Использовать Grep для поиска конкретной функции вместо чтения всего файла
- Использовать offset/limit при чтении больших файлов
- НЕ читать: .venv, node_modules, __pycache__, *.lock

### Ответы пользователю
- Короткие ответы — только суть
- НЕ выводить листинги файлов если не просят
- НЕ пересказывать что сделал — пользователь видит изменения сам
- НЕ писать "Готово! Вот что я сделал: ..."

### TodoWrite
- Только для задач с 3+ реальными независимыми шагами
- НЕ обновлять при каждом мелком действии
- Очищать после завершения

### Сессии
- При накоплении большого контекста (>50к токенов входящих) — предложить начать новую сессию
- Перед сменой сессии обязательно обновить Obsidian

## OBSIDIAN

- REST API: `https://127.0.0.1:27124`
- Token: `4cf1fc57ec1f72876cf14d5e2755ba7b8f7cc505b5aa4cc3caa8dab960d899d7`
- Ключевые файлы:
  - `web_project_status.md` — архитектура, баги, backlog, структура проекта
  - `opencode_rules.md` — правила работы агента

## ЗАПУСК ПРОЕКТА

```bash
# Проверить бэкенд
lsof -ti:8000

# Запустить бэкенд
cd /Users/android/Desktop/FlowersPET/backend
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# Фронтенд (обычно уже запущен на :3000)
cd /Users/android/Desktop/FlowersPET/frontend && npm run dev
```

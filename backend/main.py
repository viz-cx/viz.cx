import os
import datetime as dt
from threading import Thread
from fastapi import FastAPI
import helpers.api
from dotenv import load_dotenv; load_dotenv()
from helpers.mongo import get_last_block_in_db
from helpers.viz import viz
from parser.parser import start_parsing

thread = Thread(target=start_parsing, daemon=True, name='parser')
thread.start()

app = FastAPI(root_path=os.getenv('ROOT_PATH'))

@app.get('/')
def home():
    # return viz.info()
    return {'Hello': 'World'}

@app.get('/latest_block')
def latest():
    return get_last_block_in_db()

# Количество всех операций в блокчейне.
@app.get('/count_all_tx')
def count_all_tx():
    return helpers.api.get_all_tx_number_in_db()

# Количество всех операций в блокчейне за заданный период с указанной даты.
@app.get('/count_all_tx/{to_date_str}/{period_in_seconds}')
def count_all_tx_in_period(to_date:dt.datetime=dt.datetime.now(), 
    period:dt.timedelta=dt.timedelta(hours=1)):
    to_date_str = dt.datetime.strftime(to_date, '%Y-%m-%d')
    period_in_seconds = period.seconds
    return helpers.api.get_all_tx_number_in_db_in_period(to_date, period)

# Количество операций по заданному типу за заданный период (минута, 
# час, день, неделя, месяц).
@app.get('/count_tx/')
def count_tx(operation_type:str='witness_reward'):
    return helpers.api.get_tx_number(operation_type)


# Количество распределенных SHARES по заданной операции за заданный 
# период (минута, час, день, месяц).

# Вовлечённость за 7 дней. Самые награждаемые: посты в телеграм, 
# авторы в телеграм, посты в Readdle.me, авторы в Readdle.me, 
# категории в телеграм, категории в Readdle.me по заданному периоду 
# до 7 дней. По умолчанию, за прошедшие сутки.

# Пост: автор, категория, количество наград, общая награда.

# Автор, количество постов, среднее количество наград, 
# средняя награда за пост, медианная награда за пост, 
# среднее количество комментариев.

# Категория, среднее количество наград, средняя награда за пост, 
# медианная награда за пост, среднее количество комментариев.

# Аккаунты. Количество созданных аккаунтов за заданный период.

# Сообщества в телеграм. Самые популярные сообщества/каналы 
# за заданный период времени.

# Количество всех каналов телеграм.

# Посты. Количество постов в дань за заданный период. Всего постов 
# за выбранный период. Всего постов за всё время.

# Теги. Количество использований тегов за заданный период.

# Топ награжденных. Топ наградивших.

# Распределение аккаунтов по карте мира.

# Статистика пользователя. Общее количество постов, общее количество 
# комментариев. Диаграмма распределения наград за посты. Количество 
# постов за месяц. Количество комментариев за месяц.

# Облако тегов, используемых аккаунтом.

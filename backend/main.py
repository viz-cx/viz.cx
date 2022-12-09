import os
import datetime as dt
from threading import Thread
from fastapi import FastAPI
import helpers.api
from dotenv import load_dotenv; load_dotenv()
from helpers.mongo import get_last_block_in_db
from helpers.viz import viz
from parser.parser import start_parsing, start_parsing_by_block

thread = Thread(target=start_parsing_by_block, daemon=True, name='parser')
thread.start()

app = FastAPI(root_path=os.getenv('ROOT_PATH'))

@app.get('/')
def home():
    return viz.info()
    # return {'Hello': 'World'}

@app.get('/latest_block')
def latest():
    return get_last_block_in_db()

# Количество всех операций в блокчейне.
@app.get('/count_tx/all')
def count_all_tx() -> dict:
    result = helpers.api.get_all_blocks_count_in_db()
    return {'transactions': result, 'operation type': 'all', 'date': 'all'}

# Количество всех операций в блокчейне за заданный период с указанной даты.
@app.get('/count_tx/{to_date_str}/{period_in_seconds}')
def count_all_tx_in_period(to_date:dt.datetime=dt.datetime.now(), 
                            period:dt.timedelta=dt.timedelta(hours=1)) -> dict:
    to_date_str = dt.datetime.strftime(to_date, '%Y-%m-%d %H:%M:%S')
    from_date_str = dt.datetime.strftime(to_date - period, '%Y-%m-%d %H:%M:%S')
    period_in_seconds = period.seconds
    result = helpers.api.get_all_blocks_count_in_db_in_period(to_date, period)
    return {'transactions': result, 'operation type': 'all',
            'date': {'from': from_date_str, 'to': to_date_str}}

# Количество операций по заданному типу за всё время.
@app.get('/count_tx/{operation_type}')
def count_tx_by_op_type(operation_type:str="witness_reward") -> dict:
    result = helpers.api.get_tx_number(operation_type)
    return {'transactions': result, 'operation type': operation_type,
            'date': 'all'}

# Количество операций по заданному типу за заданный период (минута, 
# час, день, неделя, месяц).
@app.get('/count_tx/{operation_type}/{to_date_str}/{period_in_seconds}')
def count_tx_by_op_type_in_period(operation_type:str="witness_reward",
                                    to_date:dt.datetime=dt.datetime.now(),
                                    period:dt.timedelta=dt.timedelta(hours=1)) -> dict:
    to_date_str = dt.datetime.strftime(to_date, '%Y-%m-%d %H:%M:%S')
    from_date_str = dt.datetime.strftime(to_date - period, '%Y-%m-%d %H:%M:%S')
    period_in_seconds = period.seconds
    result = helpers.api.get_tx_number_in_db_in_period(operation_type, to_date,
                                                        period)
    return {'transactions': result, 'operation type': operation_type,
            'date': {'from': from_date_str, 'to': to_date_str}}

# Количество SHARES, распределённых за всё время.
@app.get('/shares/all')
def shares_all() -> dict:
    result = helpers.api.get_sum_shares_all()
    return {'shares': result, 'operation type': 'all', 'date': 'all'}

# Количество SHARES, распределенных в указанный период.
@app.get('/shares/{to_date_str}/{period_in_seconds}')
def shares_all_in_period(to_date:dt.datetime=dt.datetime.now(), 
                        period:dt.timedelta=dt.timedelta(hours=1)) -> dict:
    to_date_str = dt.datetime.strftime(to_date, '%Y-%m-%d %H:%M:%S')
    from_date_str = dt.datetime.strftime(to_date - period, '%Y-%m-%d %H:%M:%S')
    period_in_seconds = period.seconds
    result = helpers.api.get_sum_shares_in_period(to_date, period)
    return {'shares': result, 'operation type': 'all', 
            'date': {'from': from_date_str, 'to': to_date_str}}

# Количество распределенных SHARES по заданной операции за заданный 
# период (минута, час, день, месяц).
@app.get('/shares/{operation_type}/{to_date_str}/{period_in_seconds}')
def shares_by_op_type_in_period(operation_type:str="witness_reward",
                                to_date:dt.datetime=dt.datetime.now(),
                                period:dt.timedelta=dt.timedelta(hours=1)) -> dict:
    to_date_str = dt.datetime.strftime(to_date, '%Y-%m-%d %H:%M:%S')
    from_date_str = dt.datetime.strftime(to_date - period, '%Y-%m-%d %H:%M:%S')
    period_in_seconds = period.seconds
    result = helpers.api.get_sum_shares_by_op_in_period(operation_type, 
                                                        to_date, period)
    return {'shares': result, 'operation type': operation_type, 
            'date': {'from': from_date_str, 'to': to_date_str}}
            
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

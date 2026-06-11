FROM python:3.12

WORKDIR /code

COPY requirements.txt /code/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY ./ /code/

# --proxy-headers + forwarded-allow-ips: trust X-Forwarded-Proto from
# kamal-proxy (it connects from the docker network, not 127.0.0.1) so
# redirects/url_for emit https, not http.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]

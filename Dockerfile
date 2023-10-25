FROM python:3.10

WORKDIR /WebMap

COPY . .

RUN pip install -r requirements.txt

CMD ["python", "WebMap/app.py"]
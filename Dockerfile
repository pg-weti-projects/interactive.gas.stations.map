FROM python:3.10

WORKDIR /WebMap

COPY requirements.txt requirements.txt

RUN pip install -r requirements.txt

COPY WebMap/ /WebMap

CMD ["python", "app.py"]
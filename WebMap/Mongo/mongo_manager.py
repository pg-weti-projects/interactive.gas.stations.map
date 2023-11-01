import configparser
import pymongo
import logging

log = logging.getLogger(__name__)


class MongoManager:
    """
    Class to connect with mongo database and handle all operations related to.
    """

    def __init__(self, config_path='./config.ini'):
        self.cfg = configparser.ConfigParser()
        self.cfg.read(config_path)   # TODO maybe pass as argument in the future
        self.url = "mongodb://localhost:27017"
        self.client = pymongo.MongoClient(self.url,  # TODO maybe create ConfigManager class
                                          username=self.cfg.get('mongo', 'username'),
                                          password=self.cfg.get('mongo', 'password'))
        self.db = self.client['GIS']

    def _check_and_add_element(self, row_data: dict) -> None:
        """
        Check if records exists in database. The record is added if it doesn't exist.
        """
        _id = row_data['_id']

        if _id:
            db_record = self.gas_stations_collection.find_one({"_id": _id})

            if db_record is None:
                self.gas_stations_collection.insert_one(row_data)
                log.info(f"Successfully added new record with _id: {_id}")
            else:
                log.warning(f"Record with _id: {_id} already exist in database. Skipping.")

    def add_records_to_db(self, rows_data: list | dict) -> None:
        """
        Add new rows with data to GIS mongo database and gasStations collection.
        """
        if isinstance(rows_data, list):
            for element in rows_data:
                self._check_and_add_element(element)
        elif isinstance(rows_data, dict):
            self._check_and_add_element(rows_data)
        else:
            raise TypeError("Invalid data type when trying to insert it to mongoDB!")

    @property
    def gas_stations_collection(self):
        return self.db['gasStations']

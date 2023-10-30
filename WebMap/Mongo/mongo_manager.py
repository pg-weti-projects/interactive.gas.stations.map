import configparser
import pymongo


class MongoManager:
    """
    Class to connect with mongo database and handle all operations related to.
    """

    def __init__(self, config_path='./config.ini'):
        self.cfg = configparser.ConfigParser()
        self.cfg.read(config_path)   # TODO maybe pass as argument in the future
        self.url = "mongodb://localhost:27017"
        self.client = pymongo.MongoClient(self.url,
                                          username=self.cfg.get('mongo', 'username'),
                                          password=self.cfg.get('mongo', 'password'))  # TODO maybe create ConfigManager class
        self.db = self.client['GIS']

    def add_rows_to_db(self, rows_data: list | dict) -> None:
        """
        Add new rows with data to GIS mongo database and gasStations collection.
        """
        if isinstance(rows_data, list):
            for element in rows_data:
                self.gas_stations_collection.insert_one(element)
        elif isinstance(rows_data, dict):
            self.gas_stations_collection.insert_one(rows_data)
        else:
            raise TypeError("Invalid data type when trying to insert it to mongoDB")

    @property
    def gas_stations_collection(self):
        return self.db['gasStations']

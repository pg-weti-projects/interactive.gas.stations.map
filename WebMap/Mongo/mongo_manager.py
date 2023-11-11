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

        lat = row_data['lat']
        lon = row_data['lon']
        string_lon = str(lon).split('.')
        string_lat = str(lat).split('.')
        float_lat = float(string_lat[0] + '.' + string_lat[1][:3])
        float_lon = float(string_lon[0] + '.' + string_lon[1][:3])

        float_lat_str = f"{float_lat:.3f}"
        float_lon_str = f"{float_lon:.3f}"
        float_lon_minus_str = f"{float_lon - 0.001:.3f}"
        float_lat_minus_str = f"{float_lat - 0.001:.3f}"
        float_lat_plus_str = f"{float_lat + 0.001:.3f}"
        float_lon_plus_str = f"{float_lon + 0.001:.3f}"

        if _id:
            try:
                existing_record = self.gas_stations_collection.find_one({
                    "$or": [
                        {"_id": _id},
                        {"float_lat": float_lat_str, "float_lon": float_lon_str},
                        {"float_lat": {"$gte": float_lat_str, "$lte": float_lat_plus_str},
                         "float_lon": float_lon_str},
                        {"float_lat": float_lat_str,
                         "float_lon": {"$gte": float_lon_str, "$lte": float_lon_plus_str}},
                        {"float_lat": {"$gte": float_lat_minus_str, "$lte": float_lat_str},
                         "float_lon": float_lon_str},
                        {"float_lat": float_lat_str,
                         "float_lon": {"$gte": float_lon_minus_str, "$lte": float_lon_str}}
                    ]
                })

                if existing_record is None:
                    self.gas_stations_collection.insert_one(
                        {**row_data, 'float_lat': float_lat_str, 'float_lon': float_lon_str})
                    log.info(f"Successfully added a new record with _id: {_id}")
                else:
                    log.warning(
                        f"Record with coordinates ({float_lat_str}, {float_lon_str}) already exists in the database. Skipping.")
            except pymongo.errors.PyMongoError as e:
                log.error(f"Error while communicating with the database: {str(e)}")

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

    def get_records_from_db(self):
        """
            Retrieve data, including coordinates, station name, and brand for using the API.
        """
        try:
            gas_stations_data = list(
                self.db.gasStations.find({}, {'_id': 0, 'lon': 1, 'lat': 1, 'name': 1, 'brand': 1}))
            return gas_stations_data
        except Exception as e:
            raise TypeError('Error downloading data: ', str(e))

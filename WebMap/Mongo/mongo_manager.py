import configparser
import hashlib
from typing import Dict, List, Any, Mapping

import pymongo
import logging
from math import radians, cos, sin, asin, sqrt
from bson import ObjectId
from pymongo.results import InsertOneResult, DeleteResult

log = logging.getLogger(__name__)


class MongoManager:
    """
        Class to connect with mongo database and handle all operations related to.
    """

    def __init__(self, config_path='./config.ini'):
        self.cfg = configparser.ConfigParser()
        self.cfg.read(config_path)   # TODO maybe pass as argument in the future
        self.client = pymongo.MongoClient(self.cfg.get('mongo', 'host'),
                                          self.cfg.getint('mongo', 'port'),
                                          username=self.cfg.get('mongo', 'username'),
                                          password=self.cfg.get('mongo', 'password'))
        self.db = self.client['GIS']

    def generate_unique_id(self) -> str:
        """
        Generate a unique _id that does not exist in the specified MongoDB collection.
        """
        while True:
            new_id = ObjectId()
            if not self.gas_stations_collection.find_one({'_id': new_id}):
                return str(new_id)

    def _check_and_add_element(self, row_data: dict) -> None:
        """
            Check if records exists in database. The record is added if it doesn't exist.
        """
        _id = row_data['_id']

        string_lon = str(row_data['lon']).split('.')
        string_lat = str(row_data['lat']).split('.')
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
                        f"Record with coordinates ({float_lat_str}, {float_lon_str}) already exists in the database. "
                        f"Skipping.")
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

    def add_user_record(self, row_data: dict) -> None:
        """
            Add a new row of user input data.
        """
        new_id = self.generate_unique_id()
        row_data['_id'] = new_id
        self.gas_stations_collection.insert_one(row_data)

    def update_record(self, row_data: dict):
        """
            Update user-entered data to marker.
        """
        update_data = row_data.copy()
        del update_data["_id"]

        return self.gas_stations_collection.update_one({'_id': row_data['_id']}, {'$set': update_data})

    @property
    def gas_stations_collection(self):
        """Property method to access the 'gas stations' collection in the database."""
        return self.db['gasStations']

    def get_records_from_db(self) -> list:
        """
            Retrieve data, including coordinates, station name, and brand for using the API.
        """
        try:
            gas_stations_data = list(
                self.db.gasStations.find({}, {'_id': 1, 'lon': 1, 'lat': 1, 'name': 1, 'brand': 1,
                                              'fuel:diesel': 1, 'fuel:lpg': 1, 'fuel:octane_95': 1, 'fuel:octane_98': 1,
                                              'opening_hours': 1}))
            return gas_stations_data
        except Exception as e:
            raise TypeError('Error downloading data: ', str(e))

    @property
    def is_database_exist(self):
        return self.gas_stations_collection.count_documents({})

    def delete_record_from_db(self, _id: Any) -> DeleteResult:
        return self.gas_stations_collection.delete_one({'_id': _id})

    @staticmethod
    def find_nearest_coordinate(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
        """
        Calculates the distance between two coordinates using the Haversine formula.

        :return: Distance between the two coordinates in kilometers
        """
        earth_radius = 6371

        lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

        lambda_lon = lon2 - lon1
        lambda_lat = lat2 - lat1

        hav_cos = cos(lat1) * cos(lat2)
        haversine = sin(lambda_lat / 2) ** 2 + hav_cos * sin(lambda_lon / 2) ** 2
        distance = 2 * earth_radius * asin(sqrt(haversine))

        return distance

    @property
    def users_collection(self):
        """Property method to access the 'users' collection in the database."""
        return self.db['users']

    def register_user(self, username: str, password: str, average_fuel: str) -> bool:
        """Registers a new user in the system with a unique ID, storing their hashed password."""
        id_user = self.generate_unique_id()
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        user_data = {
            '_id': id_user,
            'username': username,
            'password': hashed_password,
            'average_fuel': average_fuel
        }
        exist = self.users_collection.find_one({'username': username})
        if exist is not None:
            log.error(f"This user exist in the database: ")
            return False
        else:
            self.users_collection.insert_one(user_data)
            return True

    def login_user(self, username: str, password: str) -> tuple[bool, Any] | tuple[bool, None]:
        """Logs in a user by checking their username and password against stored data."""
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        user = self.users_collection.find_one({'username': username, 'password': hashed_password})
        if user:
            log.info(f"User '{username}' successfully logged in.")
            return True, user['_id']
        else:
            log.warning(f"Failed login attempt for user '{username}'.")
            return False, None

    @property
    def favorite_collection(self):
        """Property method to access the 'favorite' collection in the database."""
        return self.db['favorite']

    def add_favorites(self, favorite_id: int, user_id: str) -> InsertOneResult:
        """Adds a favorite gas station for a user."""
        return self.favorite_collection.insert_one({'favorite_id': favorite_id, 'user_id': user_id})

    def remove_favorite(self, favorite_id: int, user_id: str) -> DeleteResult:
        """Remove a favorite gas station associated with a user."""
        return self.favorite_collection.delete_one({'favorite_id': favorite_id, 'user_id': user_id})

    def check_favorite(self, favorite_id: int, user_id: str) -> bool:
        """Check if a gas station is marked as a favorite by the user."""
        favorite_record = self.favorite_collection.find_one({'favorite_id': favorite_id, 'user_id': user_id})
        return favorite_record is not None

    def get_favorites(self, user_id: str) -> dict[str, list[dict[str, Any]]]:
        """Retrieves favorite gas stations for a given user."""
        fav_gas_stations = self.favorite_collection.find({'user_id': user_id})
        result = []
        for fav_gas_station in fav_gas_stations:
            station = self.gas_stations_collection.find_one({'_id': fav_gas_station['favorite_id']})
            if "brand" not in station:
                station["brand"] = "undefined"
            if "name" not in station:
                station["name"] = "undefined"
            result.append({
                "_id": station["_id"],
                "name": station["name"],
                "brand": station["brand"],
                "lon": station["lon"],
                "lat": station["lat"]
            })

        return {"favoriteStations": result}

    @property
    def reviews_collection(self):
        """Property method to access the 'reviews' collection in the database."""
        return self.db['reviews']

    def add_review(self, user_id: str, data: dict) -> InsertOneResult:
        """Add a review of gas stations for a given user."""
        station_id = data['stationId']
        rating = data['rating']
        comment = data['comment']
        return self.reviews_collection.insert_one({'user_id': user_id, 'station_id': station_id, 'rating': rating,
                                                   'comment': comment})

    def get_reviews(self, station_id: str) -> list[Mapping[str, Any] | Any]:
        """Retrieves reviews of gas stations."""
        try:
            reviews = list(
                self.reviews_collection.find({'station_id': int(station_id)},
                                             {'_id': 1, 'user_id': 1, 'station_id': 1, 'rating': 1, 'comment': 1}))
            for review in reviews:
                user_id = review['user_id']
                user = self.users_collection.find_one({'_id': user_id}, {'username': 1})
                if user:
                    review['username'] = user['username']
                else:
                    review['username'] = None
            return reviews
        except Exception as e:
            raise TypeError('Error downloading data: ', str(e))

    def get_station_ratings(self) -> list[dict]:
        """Retrieve and calculate average ratings for all stations."""
        try:
            pipeline = [
                {
                    '$group': {
                        '_id': '$station_id',
                        'average_rating': {'$avg': {'$toDouble': "$rating"}},
                        'review_count': {'$sum': 1}
                    }
                },
                {
                    '$sort': {'average_rating': -1}
                }
            ]
            result = list(self.reviews_collection.aggregate(pipeline))
            for item in result:
                station_id = item['_id']
                station = self.gas_stations_collection.find_one({'_id': station_id}, {'name': 1})
                item['station_name'] = station['name'] if station else None
            return result
        except Exception as e:
            raise TypeError('Error retrieving station ratings: ', str(e))
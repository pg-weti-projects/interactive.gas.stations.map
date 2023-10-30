import pymongo


class MongoManager:
    """
    Class to connect with mongo database and handle all operations related to.
    """

    def __init__(self):
        self.url = "mongodb://localhost:27017"
        self.client = pymongo.MongoClient(self.url)
        self.db = self.client['GIS']


    def add_rows_to_db(self, elements: list) -> None:
        for element in elements:
            self.gis_stats_collection.insert_one(element)


    @property
    def gis_stats_collection(self):
        return self.db['OpenStreetView']

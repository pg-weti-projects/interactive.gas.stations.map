import random
import requests


class OsmManager:
    """
    Class responsible for connection with overpass api interpreter and all operations related to receiving data from it.
    """
    def __init__(self):
        self.__url = "https://overpass-api.de/api/interpreter"
        self.__overpass_query = """
        [out:json];
        area["ISO3166-1"="PL"]->.searchArea;
        (
          nwr["amenity"="fuel"](area.searchArea);
        );
        out center;
        """
        self.__using_fields = ("_id", "lon", "lat", "amenity", "brand", "name", "fuel:HGV_diesel", "fuel:adblue",
                               "fuel:diesel", "fuel:lpg", "fuel:octane_95", "fuel:octane_98", "opening_hours")
        self.__fields_to_fill_if_empty = ("name", "brand", "fuel:HGV_diesel", "fuel:adblue", "fuel:diesel", "fuel:lpg",
                                          "fuel:octane_95", "fuel:octane_98", "opening_hours")

    @staticmethod
    def _add_tags_to_main_dict(record: dict) -> dict:
        """
        Extracting information from internal dictionaries and merging them with main dictionary. Changing record id to
        _id which will serve as an identifier in the database.

        :return: Data from record in one dictionary
        """
        connected_dict = {}

        for key, value in record.items():
            if isinstance(value, dict):
                for sub_key, sub_value in value.items():
                    connected_dict[sub_key] = sub_value
            elif key == 'id':
                connected_dict['_id'] = value

            else:
                connected_dict[key] = value

        return connected_dict

    def remove_unused_fields_from_data(self, data: list) -> list:
        """
        Removing unused fields from received from overpass data.

        :param data:  Data from unused fields should be removed

        :return: Data with removed unused fields
        """

        cleared_data = []
        for row in data:
            copied_dict = row.copy()
            for key in row.keys():
                if key not in self.__using_fields:
                    copied_dict.pop(key)
            cleared_data.append(copied_dict)

        return cleared_data

    def add_random_data_to_empty_fields(self, data: list) -> list:
        """
        Adds random data to empty cell in each in given data.
        :param data: Data with missing cells
        :return: Filled data
        """
        yes_no_value = ("yes", "no")
        opening_hours_value = ("24/7", "6-18/7", "8-20/7", "9-21/7", "6-23/7")

        for record in data:
            for field in self.__fields_to_fill_if_empty:
                if field not in record.keys():
                    if field == "opening_hours":
                        record[field] = random.choice(opening_hours_value)
                    elif field == "name" or field == "brand":
                        record[field] = "Unknown"
                    else:
                        record[field] = random.choice(yes_no_value)

        return data

    def get_data_from_overpass_api(self) -> list:
        """
        Receive data from overpass turbo api related to all gas stations in Poland

        :return: Received data from api
        """
        response = requests.get(self.__url, params={"data": self.__overpass_query})

        received_data = response.json()
        data_list = []

        for record in received_data['elements']:
            data_list.append(self._add_tags_to_main_dict(record))

        data_list = self.remove_unused_fields_from_data(data_list)
        data_list = self.add_random_data_to_empty_fields(data_list)

        return data_list

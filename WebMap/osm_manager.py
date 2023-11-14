import requests


class OsmManager:
    """
    Class responsible for connection with overpass api interpreter and all operations related to receiving data from it.
    """
    def __init__(self):
        self.url = "https://overpass-api.de/api/interpreter"
        self.overpass_query = """
        [out:json];
        area["ISO3166-1"="PL"]->.searchArea;
        (
          nwr["amenity"="fuel"](area.searchArea);
        );
        out center;
        """

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

    def get_data_from_overpass_api(self) -> list:
        """
        Receive data from overpass turbo api related to all gas stations in Poland

        :return: Received data from api
        """
        response = requests.get(self.url, params={"data": self.overpass_query})

        received_data = response.json()

        data_list = []

        for record in received_data['elements']:
            data_list.append(self._add_tags_to_main_dict(record))

        return data_list
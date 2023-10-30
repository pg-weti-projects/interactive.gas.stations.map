import requests

class OsmManager:
    def __init__(self):
        self.url = "https://overpass-api.de/api/interpreter"
        self.overpass_query = """
            [out:json];
            area["ISO3166-1"="PL"]->.searchArea;
            (
              node["amenity"="fuel"]["addr:city"="Grudziądz"](area.searchArea);
              way["amenity"="fuel"]["addr:city"="Grudziądz"](area.searchArea);
              relation["amenity"="fuel"]["addr:city"="Grudziądz"](area.searchArea);
            );
            out body;
            >;
            out skel qt;
        """

    def get_data_from_interpreter(self):
        response = requests.get(self.url, params={"data": self.overpass_query})

        data = response.json()

        print(data)



manager = OsmManager()

manager.get_data_from_interpreter()


# """
# [out:json];
# area["ISO3166-1"="PL"]->.searchArea;
# (
# node["amenity"="fuel"]["brand"](area.searchArea);
# way["amenity"="fuel"]["brand"](area.searchArea);
# relation["amenity"="fuel"]["brand"](area.searchArea);
# );
# out body;
# >;
# out skel qt;
# """
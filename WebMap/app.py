from flask import Flask, render_template

from osm_manager import OsmManager
from Mongo.mongo_manager import MongoManager

app = Flask(__name__)


@app.route("/")
def interactive_map():
    """
    main website page.
    """

    osm_manager = OsmManager()
    mongo_manager = MongoManager()

    received_data = osm_manager.get_data_from_overpass_api()

    mongo_manager.add_records_to_db(received_data)

    return render_template("base.html")


if __name__ == "__main__":
    app.run(debug=False, host='0.0.0.0', port=8085)

import flask
from flask import Flask, render_template, jsonify, redirect, url_for

from osm_manager import OsmManager
from Mongo.mongo_manager import MongoManager

app = Flask(__name__)


@app.route("/")
def interactive_map() -> flask.Response | str:
    """
    Main website page with map. Check that database exists before launching the website. If not redirect to
    create_database first.
    """
    mongo_manager = MongoManager()
    if mongo_manager.is_database_exist > 0:

        return render_template("base.html")
    else:

        return redirect(url_for('create_database'))


@app.route("/api/gas_station_data")
def data_map() -> flask.Response:
    """
    Route api with gas stations data.
    """
    mongo_manager = MongoManager()
    data = mongo_manager.get_records_from_db()
    return jsonify(data)


@app.route("/database")
def create_database() -> flask.Response:
    """
    Route witch creating / updating database.
    """
    osm_manager = OsmManager()
    mongo_manager = MongoManager()

    received_data = osm_manager.get_data_from_overpass_api()

    mongo_manager.add_records_to_db(received_data)

    return redirect(url_for('interactive_map'))


if __name__ == "__main__":
    app.run(debug=False, host='0.0.0.0', port=8085)

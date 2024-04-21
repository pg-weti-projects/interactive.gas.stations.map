import flask
from flask import Flask, render_template, jsonify, redirect, url_for, request

from osm_manager import OsmManager
from Mongo.mongo_manager import MongoManager

app = Flask(__name__)

mongo_manager = MongoManager()


@app.route("/")
def interactive_map() -> flask.Response | str:
    """
    Main website page with map. Check that database exists before launching the website. If not redirect to
    create_database first.
    """
    if mongo_manager.is_database_exist > 0:
        return render_template("base.html")
    else:

        return redirect(url_for('create_database'))


@app.route("/api/gas_station_data")
def data_map() -> flask.Response:
    """
    Route api with gas stations data.
    """
    data = mongo_manager.get_records_from_db()
    return jsonify(data)


@app.route('/api/add_marker', methods=['POST'])
def add_marker() -> flask.request:
    try:
        data = request.get_json()

        mongo_manager.add_user_record(data)

        return jsonify({'success': True, 'message': 'Marker removed successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route("/api/update_data_marker", methods=["POST"])
def update_data_marker() -> flask.request:
    """
        Route api to update marker data.
    """
    try:
        data = request.get_json()

        mongo_manager.update_record(data)

        return jsonify({'success': True, 'message': 'Marker removed successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/remove_marker', methods=['POST'])
def remove_marker() -> flask.request:
    try:
        data = request.get_json()
        marker_id = data.get('_id')

        mongo_manager.delete_record_from_db(marker_id)

        return jsonify({'success': True, 'message': 'Marker removed successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route("/api/find_nearest_station/<float:lon>/<float:lat>")
def find_nearest_station(lon: float, lat: float) -> flask.Response:
    """
    Route API to find the nearest gas station.

    :return: Coordinates of the nearest gas station.
    """
    response = data_map()
    data = response.json
    nearest_stations = []

    for item in data:
        lat_find = float(item.get("lat"))
        lon_find = float(item.get("lon"))
        nearest_coordination = mongo_manager.find_nearest_coordinate(lon, lat, lon_find, lat_find)

        station_data = {
            'lat': lat_find,
            'lon': lon_find,
            'km': nearest_coordination
        }

        nearest_stations.append(station_data)
    nearest_station = min(nearest_stations, key=lambda x: x['km'])
    return jsonify({"stationCoords": [nearest_station['lon'], nearest_station['lat']]})


@app.route("/database")
def create_database() -> flask.Response:
    """
    Route witch creating / updating database.
    """
    osm_manager = OsmManager()

    received_data = osm_manager.get_data_from_overpass_api()

    mongo_manager.add_records_to_db(received_data)

    return redirect(url_for('interactive_map'))


if __name__ == "__main__":
    app.run(debug=False, host='0.0.0.0', port=8085)

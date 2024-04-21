import flask
from flask import Flask, render_template, jsonify, redirect, url_for, request
from functools import wraps

from werkzeug import Response

from osm_manager import OsmManager
from Mongo.mongo_manager import MongoManager

app = Flask(__name__)
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'

mongo_manager = MongoManager()


def login_required(test):
    """
    Decorator to ensure user authentication before accessing a route.

    :return: The decorated function.
    """
    @wraps(test)
    def wrap(*args, **kwargs):
        if 'user_id' in flask.session:
            return test(*args, **kwargs)
        else:
            return redirect(url_for('login_user'))

    return wrap


@app.route("/")
@login_required
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


@app.route('/api/add_to_favorites', methods=['POST'])
def add_to_favorites() -> flask.Response:
    """
    Endpoint to add a gas station to user favorites via API.

    :return: JSON response indicating the success or failure of the operation.
    """
    data = request.json
    favorite_id = data['A']['id']
    user_id = flask.session['user_id']

    mongo_manager.add_favorites(favorite_id, user_id)
    return jsonify({'message': 'Station added to favorites successfully'})


@app.route('/api/favorite_stations', methods=['GET'])
def favorite_stations() -> flask.Response:
    """
    Endpoint to retrieve a user's favorite gas stations via API.

    :return: JSON response containing the favorite gas stations or a message if there are none.
    """
    user_id = flask.session['user_id']
    favorite_station = mongo_manager.get_favorites(str(user_id))

    if favorite_station is not None:
        return jsonify(favorite_station)
    else:
        return jsonify({'message': 'No favorites'})


@app.route("/database")
def create_database() -> flask.Response:
    """
    Route witch creating / updating database.
    """
    osm_manager = OsmManager()

    received_data = osm_manager.get_data_from_overpass_api()

    mongo_manager.add_records_to_db(received_data)

    return redirect(url_for('interactive_map'))


@app.route('/login', methods=['GET', 'POST'])
def login_user() -> str | Response:
    """
    Handles user login via a web interface.

    :return: Rendered template for the login page or redirect to the interactive map.
    """
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        success, user_id = mongo_manager.login_user(username, password)
        if success is False:
            return render_template('login.html', error='Username or password is incorrect')
        else:
            flask.session['user_id'] = str(user_id)
            return redirect(url_for('interactive_map'))

    return render_template('login.html')


@app.route('/register', methods=['GET', 'POST'])
def register_user() -> str | Response:
    """
    Registers a new user via a web interface.

    :return: Rendered template for the registration page or redirect to the login page.
    """
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        result = mongo_manager.register_user(username, password)
        if result is False:
            return render_template('register.html', error='Username already exists')
        else:
            return redirect(url_for('login_user'))

    return render_template('register.html')


@app.route('/logout', methods=['POST'])
def logout() -> flask.Response:
    """
    Logs out the current user and redirects to the login page.

    :return: Redirect to the login page.
    """
    flask.session.pop('user_id', None)
    return redirect(url_for('login_user'))


if __name__ == "__main__":
    app.run(debug=False, host='0.0.0.0', port=8085)

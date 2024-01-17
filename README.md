## INTERACTIVE MAP - GIS PROJECT

The web application allows users to display an interactive map with markers of fuel stations across Poland. Users can add their own markers, edit information about existing gas stations, and remove them. The application also provides a range of additional features such as filtering displayed indicators of gas stations, finding the route to the nearest station, or changing the style of the displayed map.
<br>

### Tech Stack

- Python 3.10
- Flask
- MongoDB
- HTML5 + CSS3
- JavaScript
- OpenLayers 6
- jQuery
- Bootstrap
- Docker and docker-compose

## Installation

### Requirements

- `docker`
- `docker-compose`

### Init in Ubuntu
```bash
sudo apt-get install docker docker-compose
git clone https://gitlab.com/weti-study-projects/gis.systems.project.git
cd gis.systems.project
```

### First configuration
1. Create **venv** with **python 3.10** in repository directory and activate it.
```shell
python  -m venv venv
source venv/bin/activate
```

2. Install all requirements using below command (you can run it from this place):
```shell
pip install -r requirements.txt
```

3. Complete the **config.ini.example** file with the required data and rename the file to **'config.ini'**.


### RUN
To run this application use below command:

```shell
docker-compose up
```

<br>
<br>

#### Authors: Marta Bartsch, Michał Dudziak
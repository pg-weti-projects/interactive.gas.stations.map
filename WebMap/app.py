from flask import Flask, render_template

app = Flask(__name__)


@app.route("/")
def interactive_map():
    return render_template("base.html")


if __name__ == "__main__":
    app.run(debug=True, port=8081)

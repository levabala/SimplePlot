class SimplePlot {
  constructor(div, points_count = 10, line_color = "darkgreen") {
    this.div = div;
    this.points_count = points_count;
    this._real_points_count = points_count;
    this.draw = SVG(div);
    this.main_nest = this.draw.nested();
    this.main_group = this.main_nest.group();
    this.colors = {
      line: line_color
    }
    this.polyline = null;
    this.max_value = 1;
    this.min_value = 0;
    this.div_width = 0;
    this.div_height = 0;

    //constants
    this.OFFSET_BOTTOM = 0.2;
    this.OFFSET_TOP = 0.2;

    this._createPolyline();
    this.auto_scale();
    this._recalcSize();
  }

  _getElMatrix(el) {
    let transform = el.attr("transform");
    if (transform === undefined)
      return null;
    return transform
      .split("(")[1]
      .replace(")", "")
      .split(",")
      .map((el) => parseFloat(el));
  }

  _resetMatrixTranslate(matrix) {
    var map = [1, 1, 1, 1, 0, 0];
    return matrix.map((item, i, array) => item * map[i]);
  }

  auto_scale() {
    var matrix = this._getElMatrix(this.main_group);
    if (matrix != null)
      this.main_group.matrix(this._resetMatrixTranslate(matrix));

    var scales = this._calcScale();
    this.main_group.scale(scales.sx, scales.sy);

    matrix = this._getElMatrix(this.main_group);
    this.main_group.matrix(this._resetMatrixTranslate(matrix));

    this.main_group.translate(0, (-this.min_value + this.OFFSET_TOP) * scales.sy);
  }

  _recalcSize() {
    let jq_div = $(this.div);
    this.div_width = jq_div.width();
    this.div_height = jq_div.height();
  }

  _calcScale() {
    if (this.div_height * this.div_height == 0)
      this._recalcSize();
    return {
      sx: this.div_width,
      sy: this.div_height / (this.max_value - this.min_value + this.OFFSET_BOTTOM + this.OFFSET_TOP),
    };
  }

  _createPolyline() {
    this.main_group.clear();

    //all is in range(0, 1)
    let points = [];
    for (let i = 0; i < this.points_count; i++)
      points.push([1 / this.points_count * i, 1 - this.OFFSET_BOTTOM]);

    this.polyline = this.main_group.polyline(points).fill("none").stroke({
      color: this.colors.line,
      width: 0.01,
    }).attr("stroke-linejoin", "round");
  }

  applyDataSimple(data) {
    let points = [];
    let max_value = Number.MIN_SAFE_INTEGER;
    let min_value = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < data.length; i++) {
      let value = -data[i];
      points.push([i / data.length, value]);
      max_value = Math.max(max_value, value);
      min_value = Math.min(min_value, value);
    }

    this.max_value = max_value;
    this.min_value = min_value;

    this.polyline.plot(points);
    this.auto_scale();
  }

  applyData(data) {
    this._real_points_count = Math.min(this.points_count, data.length);
    let step = data.length / this._real_points_count;

    let points = [
      [0, data[0]]
    ];
    let data_index = 0;
    let buffer = 0;
    let max_value = Number.MIN_SAFE_INTEGER;
    let min_value = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < this._real_points_count; i++) {
      buffer += step;
      let data_count = Math.floor(buffer);
      buffer -= data_count;

      let sum = 0;
      for (let i2 = data_index; i2 < data_index + data_count; i2++)
        sum += data[i2];

      let average = -sum / data_count;
      if (isNaN(average))
        debugger;
      let x = i / this._real_points_count;
      points[i] = [x, average];

      data_index += data_count;

      max_value = Math.max(max_value, average);
      min_value = Math.min(min_value, average);
    }

    this.max_value = max_value;
    this.min_value = min_value;

    this.polyline.plot(points);
    this.auto_scale();
  }
}
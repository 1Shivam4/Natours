class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };

    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(e => {
      delete queryObj[e];
    });

    let queryStr = JSON.stringify(queryObj);

    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      // so when we request for any features separately it will give an error
      // called this.queryString.sort.split is not a function
      // this is because it will create a an array out of the query string
      // which will prevent us from the getting data we want
      // console.log(this.queryString.sort);
      const sortBy = this.queryString.sort.split(',').join('.');
      this.query = this.query.sort(sortBy);
      // sort('price ratingAverage')
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  panginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;

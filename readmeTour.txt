 // This is used to exclude the undesired requests like
    // different page sorting and limit requests
    // from our filter method

    // // BUILD QUERY
    // // 1.a. Filtering
    // const queryObj = { ...req.query };
    // const excludedFields = ["page", "sort", "limit", "fields"];
    // excludedFields.forEach((e) => {
    //   delete queryObj[e];
    // });

    // // 1.b. Advanced filtering

    // let queryStr = JSON.stringify(queryObj);
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `${match}`);
    // console.log(JSON.parse(queryStr));

    // // {diffulcity:"easy", duration:{$gte:5}} uing text method
    // //{ difficulty: 'easy', duration: { '$gte': '5' } }
    // // gte,gt,lte,lt

    // let query = Tour.find(JSON.parse(queryStr));

    // // 2.SORTING
    // if (req.query.sort) {
    //   const sortBy = req.query.sort.split(",").join(" ");
    //   query = query.sort(sortBy);
    //   // sort('price ratingAverage')
    // } else {
    //   query = query.sort("-createdAt");
    // }

    // FIELD LIMITING
    // if (req.query.fields) {
    //   const fields = req.query.fields.split(",").join(" ");
    //   query = query.select(fields); // This type of query is called projection
    // } else {
    //   query = query.select("-__v");
    //   // by using - sign before the __v parameter
    //   // We are basically excluding the __v
    //   // Parameter to show itself to the client
    // }

    // // PANGINATION

    // const page = req.query.page * 1 || 1;
    // const limit = req.query.limit * 1 || 100;
    // const skip = (page - 1) * limit;

    // // page=2&limit=10, 1-10,11-20,21-30
    // // each page will have the defined limit
    // // and if the limit exceeds then the data
    // // will be transferred to the next page

    // query = query.skip(skip).limit(limit);

    // if (req.query.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skip >= numTours) throw new Error("This page does not exists");
    // }

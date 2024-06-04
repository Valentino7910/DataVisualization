const input = document.getElementById("yearRange");
const yearValue = document.getElementById("yearValue");
const svgMap = d3.select("#map");
const barSvg = d3.select("#bar").append("svg");

const projection = d3.geoNaturalEarth1();
const pathGenerator = d3.geoPath().projection(projection);

const width = 900;
const height = 400;

// 创建提示工具
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

svgMap
  .append("path")
  .attr("class", "sphere")
  .attr("d", pathGenerator({ type: "Sphere" }));

function renderMap(features, rawData, year) {
  const filterData = rawData.filter(
    (d) => d.Year === year && d.Gender === "Total" && d.Age === "Total"
  );
  console.log(filterData, "filterData");

  const sumList = d3
    .rollups(
      filterData,
      (D) => d3.sum(D, (d) => d.Value),
      (d) => d.Country,
      (d) => d.Year
    )
    .map((item) => {
      return {
        name: item[0],
        value: item[1][0][1],
      };
    });

  console.log(sumList);

  const colorScale = d3
    .scaleSequential(d3.interpolateOrRd)
    .domain([0, d3.max(sumList, (d) => +d.value) / 2]);

  svgMap
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("class", "country")
    .attr("d", pathGenerator)
    .attr("stroke-width", "1px");

  d3.selectAll(".country")
    .attr("fill", (d, i) => {
      const items = filterData.filter((item) => {
        return item["Country"] === d.properties.name;
      });
      const sum = d3.sum(items, (d) => +d.Value);
      if (sum) {
        return colorScale(+sum);
      } else {
        return "#fff";
      }
    })
    .on("mouseover", function (event, d) {
      const items = filterData.filter((item) => {
        return item["Country"] === d.properties.name;
      });
      const sum = d3.sum(items, (d) => +d.Value);
      d3.select(this).attr("opacity", 1).attr("stroke-width", 2);
      tooltip
        .style("opacity", 1)
        .html(
          `
          <p>Country: ${d.properties.name}</p>
          <p>Year: ${year}</p>
          <p>value: ${Math.round(sum)|| "No Data"}</p>
            `
        )
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY + 5}px`);
    })
    .on("mouseout", function (event, d) {
      d3.selectAll(".country").attr("opacity", 1).attr("stroke-width", 1);
      tooltip.style("opacity", 0);
    })
    .on("click", function (event, d) {
      renderBar(filterData, year, d.properties.name);
    });
}

function renderBar(rawData, year, country) {
  const data = rawData.filter(
    (item) => item.Country === country && item.Year === year
  );
  console.log(data, year, country);
  if (!data.length) {
    return;
  }
  const width = 600;
  const height = 1400;
  const margin = { t: 60, r: 20, b: 30, l: 80 };
  const innerWidth = width - margin.l - margin.r;
  const innerHeight = height - margin.t - margin.b;

  barSvg.selectAll("*").remove();
  const svg = barSvg.attr("width", width).attr("height", height);

  svg
    .append("text")
    .text(`${year} ${country} COVID-19 deaths by week`)
    .attr("transform", `translate(${innerWidth / 2 + 100}, ${margin.t / 2})`)
    .style("text-anchor", "middle")
    .attr("font-size", 14);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.l}, ${margin.t})`);

  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => +d.Value)])
    .range([0, innerWidth])
    .nice();

  const yScale = d3
    .scaleBand()
    .domain(
      d3.map(data, (item) => {
        return item.WEEK;
      })
    )
    .range([0, innerHeight])
    .padding(0.2);

  const xAxis = d3.axisTop(xScale);
  const yAxis = d3.axisLeft(yScale);

  g.append("g").call(xAxis);

  g.append("g").call(yAxis);

  g.selectAll(".rect")
    .data(data)
    .join("rect")
    .attr("class", "rect")
    .attr("width", (d) => {
      console.log(xScale(+d.Value));
      return xScale(+d.Value) > 0 ? xScale(+d.Value) : 0;
    })
    .attr("height", yScale.bandwidth())
    .attr("fill", "steelblue")
    .attr("x", (d) => {
      return 0;
    })
    .attr("y", (d) => {
      return yScale(d.WEEK);
    });

    g.selectAll(".rect")
  .data(data)
  .join("rect")
  .attr("class", "rect")
  .attr("width", (d) => {
    console.log(xScale(+d.Value));
    return xScale(+d.Value) > 0 ? xScale(+d.Value) : 0;
  })
  .attr("height", yScale.bandwidth())
  .attr("fill", "steelblue")
  .attr("x", (d) => {
    return 0;
  })
  .attr("y", (d) => {
    return yScale(d.WEEK);
  })
  .on("mouseover", function (event, d) {
    tooltip
      .style("opacity", 1)
      .html(
        `
        <p>Country: ${d.Country}</p>
        <p>Week: ${d.WEEK}</p>
        <p>Value: ${d.Value}</p>
          `
      )
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY + 5}px`);
  })
  .on("mouseout", function (event, d) {
    tooltip.style("opacity", 0);
  });

}

Promise.all([
  d3.json("./data/world.json"),
  d3.tsv("./data/50m.tsv"),
  d3.csv("./data/HEALTH_MORTALITY.csv"),
]).then((res) => {
  const [topoJSONdata, tsvData, deathData] = res || [];

  const rowById = tsvData.reduce((accumulator, d) => {
    accumulator[d.iso_n3] = d;
    return accumulator;
  }, {});

  const countries = topojson.feature(
    topoJSONdata,
    topoJSONdata.objects.countries
  );

  countries.features.forEach((d) => {
    Object.assign(d.properties, rowById[d.id]);
  });
  console.log(countries.features, "countries.features");
  renderMap(countries.features, deathData, "2020");

  // get Year extent
  console.log(
    d3.extent(
      deathData.filter((item) => item.COUNTRY === "AUS"),
      (d) => d.Year
    )
  );

  console.log(deathData);
  console.log(new Set(deathData.map((item) => item.Country)));

  input.addEventListener("input", () => {
    yearValue.textContent = input.value;
    renderMap(countries.features, deathData, input.value);
  });
});

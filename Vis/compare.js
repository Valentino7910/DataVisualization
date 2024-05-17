const groupBarSvg = d3.select("#groupBar").append("svg");
const lineSvg = d3.select("#line").append("svg");
const country1Select = document.getElementById("country1");
const country2Select = document.getElementById("country2");
const selectYear = document.getElementById("selectYear");
const trend = document.getElementById("trend");
const allTrend = document.getElementById("allTrend");

const width = 900;
const height = 400;

// 创建提示工具
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

function renderGroupBar(deathData, country1, country2, year) {
  if (country1 === country2) {
    return;
  }
  const data1 = deathData
    .filter(
      (item) => item.Country === country1 || item.Country === country2
    )
    .filter(
      (d) => d.Year === year && d.Gender === "Total" && d.Age === "Total"
    )
    .map((item) => {
      const { Value, ...rest } = item;
      return {
        ...rest,
        Value: +Number(Math.abs(+item.Value)).toFixed(0),
      };
    });

  const data = data1.reduce((acc, current) => {
    const x = acc.find(
      (item) =>
        item.WEEK === current.WEEK && item.Country === current.Country
    );
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);

  console.log(data, "data");

  var svgWidth = 1200,
    svgHeight = 450;
  var margin = 80;
  var svgInnerWidth = svgWidth - margin - margin;
  var svgInnerHeight = svgHeight - margin - margin;
  var barWidth = svgInnerWidth / (data.length + 1);

  groupBarSvg.selectAll("*").remove();
  var svg = groupBarSvg.attr("width", svgWidth).attr("height", svgHeight);

  var chart = svg
    .append("g")
    .attr("transform", `translate(${margin}, ${margin})`);

  const legend = chart
    .append("g")
    .attr("transform", `translate(${width - 250}, -50)`);

  legend
    .selectAll("rect")
    .data([country1, country2])
    .enter()
    .append("rect")
    .attr("width", 50)
    .attr("height", 10)
    .attr("x", (d, i) => i * 90)
    .attr("fill", (d, i) => (i === 0 ? "steelblue" : "darkorange"));

  legend
    .selectAll("text")
    .data([country1, country2])
    .enter()
    .append("text")
    .attr("x", (d, i) => i * 90 + 2)
    .attr("y", -8)
    .attr("font-size", 14)
    .style("text-anchor", "start")
    .attr("fill", (d, i) => (i === 0 ? "steelblue" : "darkorange"))
    .text(function (d) {
      return d;
    });

  svg
    .append("text")
    .text("Number of deaths by week")
    .attr("fill", "#000")
    .attr("x", 10)
    .attr("y", margin - 10)
    .attr("width", 200)
    .attr("height", 30)
    .attr("font-size", "12");

  svg
    .append("text")
    .text("Week")
    .attr("fill", "#000")
    .attr("x", svgWidth - margin - 20)
    .attr("y", svgHeight - margin + 35)
    .attr("width", 200)
    .attr("height", 30)
    .attr("font-size", "12");

  var yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data, function (d) {
        return Math.max(d.Value);
      }),
    ])
    .nice()
    .range([svgInnerHeight, 0]);

  var xScale = d3
    .scaleBand()
    .domain(Array.from(new Set(data.map((s) => s.WEEK))))
    .range([0, svgWidth - margin - margin])
    .padding(0.1);

  chart
    .append("g")
    .call(d3.axisBottom(xScale))
    .attr("transform", `translate(0, ${svgInnerHeight})`)
    .selectAll("text");

  chart.append("g").call(d3.axisLeft(yScale));

  var bar1 = chart
    .selectAll(".bar111")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar111")
    .attr("x", function (d, i) {
      if (d.Country === country1) {
        return xScale(d.WEEK);
      } else {
        return xScale(d.WEEK) + barWidth - 2;
      }
    })
    .attr("y", function (d) {
      return yScale(d.Value);
    })
    .attr("width", barWidth - 2)
    .attr("height", function (d) {
      if (d.Country === country1) {
        return svgInnerHeight - yScale(d.Value);
      } else {
        return svgInnerHeight - yScale(d.Value);
      }
    })
    .attr("fill", (d, i) => {
      if (d.Country === country1) {
        return "steelblue";
      } else {
        return "darkorange";
      }
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

function renderGroupLine(deathData, country1, country2, year) {
  console.log(deathData, country1, country2, year);
  groupBarSvg.selectAll("*").remove();

  if (country1 === country2) {
    return;
  }

  let data = [];
  if (!year) {
    const filterData = deathData.filter(
      (d) =>
        d.Gender === "Total" &&
        d.Age === "Total" &&
        (d.Country === country1 || d.Country === country2)
    );
    const sumList = d3.rollups(
      filterData,
      (D) => d3.sum(D, (d) => d.Value),
      (d) => d.Year,
      (d) => d.Country
    );
    console.log(sumList, "sumList");
    const data1 = [];
    sumList.forEach((item) => {
      item[1].forEach((d) => {
        data1.push({
          time: +item[0],
          name: d[0],
          value: d[1],
        });
      });
    });
    data = data1.filter(
      (d) =>
        d.time === 2020 ||
        d.time === 2021 ||
        d.time === 2022 ||
        d.time === 2023
    );
  } else {
    const data1 = deathData
      .filter(
        (d) =>
          d.Gender === "Total" &&
          d.Age === "Total" &&
          (d.Country === country1 || d.Country === country2) &&
          d.Year === year
      )
      .map((item) => {
        return {
          time: item.WEEK,
          name: item.Country,
          value: +Number(Math.abs(+item.Value)).toFixed(0),
          ...item,
        };
      });

    console.log(data1, "data1");

    data = data1.reduce((acc, current) => {
      const x = acc.find(
        (item) =>
          item.WEEK === current.WEEK && item.Country === current.Country
      );
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);
  }
  console.log(data, "data");

  const width = 1200;
  const height = 400;
  const marginTop = 60;
  const marginRight = 50;
  const marginBottom = 30;
  const marginLeft = 80;

  console.log(d3.extent(data, (d) => +d.time));

  const x = d3
    .scaleLinear()
    .domain(year ? d3.extent(data, (d) => +d.time) : [2020, 2023])
    .range([marginLeft, width - marginRight])
    .nice();

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => +d["value"])])
    .range([height - marginBottom, marginTop])
    .nice();

  const color = d3
    .scaleOrdinal()
    .domain(data.map((d) => d.name))
    .range(d3.schemeCategory10);

  const svg = groupBarSvg.attr("width", width).attr("height", height);

  const legend = svg
    .append("g")
    .attr("transform", "translate(0, 55)")
    .attr("font-size", 14)
    .selectAll("g")
    .data(Array.from(new Set(d3.map(data, (d) => d.name))))
    .join("g")
    .attr("transform", function (d, i) {
      return "translate(0," + i * 25 + ")";
    });

  legend
    .append("circle")
    .attr("r", 10)
    .attr("cx", 100)
    .attr("cy", 10)
    .attr("fill", function (d) {
      return color(d);
    });

  legend
    .append("text")
    .attr("x", 120)
    .attr("y", 15.5)
    .text(function (d) {
      return d;
    });

  svg
    .append("text")
    .text(
      `${
        year
          ? `${year} COVID-19 deaths by week`
          : `COVID-19 deaths by 2020 - 2023`
      }`
    )
    .attr("transform", `translate(${width / 2}, ${marginTop / 2})`)
    .style("text-anchor", "middle")
    .attr("font-size", "1.8em");

  svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(
      d3
        .axisBottom(x)
        .tickSizeOuter(0)
        .ticks(year ? 52 : 4)
    );

  svg
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y));

  const serie = svg
    .append("g")
    .selectAll()
    .data(
      d3.group(data, (d) => {
        return d.name;
      })
    )
    .join("g");

  serie
    .append("path")
    .attr("fill", "none")
    .attr("stroke", (d) => {
      return color(d[0]);
    })
    .attr("stroke-width", 1)
    .attr("d", (d) => {
      return d3
        .line()
        .curve(d3.curveLinear)
        .x((d) => {
          return x(+d.time) || 0;
        })
        .y((d) => y(+d["value"]))(d[1].sort((a, b) => a.time - b.time));
    });

  serie
    .selectAll("circle")
    .data((d) => d[1])
    .join("circle")
    .attr("cx", (d) => x(d.time))
    .attr("cy", (d) => y(d.value))
    .attr("r", 3)
    .attr("fill", (d) => color(d.name))
    .on("mouseover", function (event, d) {
      tooltip
        .style("opacity", 1)
        .html(
          `
          <p>Country: ${d.name}</p>
          <p>Week: ${d.time}</p>
          <p>Value: ${Math.round(d.value)}</p>
          `
        )
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY + 5}px`);
    })
    .on("mouseout", function (event, d) {
      tooltip.style("opacity", 0);
    });
}

function renderGroupBarAndLine(
  deathData,
  country1,
  country2,
  year,
  type
) {
  if (type === "bar") {
    renderGroupBar(deathData, country1, country2, year);
  } else {
    renderGroupLine(deathData, country1, country2, year);
  }
}

Promise.all([d3.csv("./data/HEALTH_MORTALITY.csv")]).then((res) => {
  const [deathData] = res || [];

  // get Year extent
  console.log(
    d3.extent(
      deathData.filter((item) => item.COUNTRY === "AUS"),
      (d) => d.Year
    )
  );

  console.log(deathData);
  console.log(new Set(deathData.map((item) => item.Country)));

  country1Select.addEventListener("change", (e) => {
    renderGroupBarAndLine(
      deathData,
      e.target.value,
      country2Select.value,
      selectYear.value,
      "bar"
    );
  });

  country2Select.addEventListener("change", (e) => {
    renderGroupBarAndLine(
      deathData,
      country1Select.value,
      e.target.value,
      selectYear.value,
      "bar"
    );
  });

  selectYear.addEventListener("change", (e) => {
    renderGroupBarAndLine(
      deathData,
      country1Select.value,
      country2Select.value,
      e.target.value,
      "bar"
    );
  });

  trend.addEventListener("click", () => {
    renderGroupBarAndLine(
      deathData,
      country1Select.value,
      country2Select.value,
      selectYear.value,
      "line"
    );
  });

  allTrend.addEventListener("click", () => {
    renderGroupBarAndLine(
      deathData,
      country1Select.value,
      country2Select.value,
      null,
      "line"
    );
  });
});


function buildTree(treeWidth, treeHeight, stumpWidth, stumpHeight) {

  var tree = new Two.Group();

  var points = [];
  var anchor = new Two.Anchor(0, 0);
  anchor.origin = new Two.Vector().copy(anchor);
  points.push(anchor);

  var anchor = new Two.Anchor(treeWidth, 0);
  anchor.origin = new Two.Vector().copy(anchor);
  points.push(anchor);

  var anchor = new Two.Anchor(treeWidth / 2, treeHeight);
  anchor.origin = new Two.Vector().copy(anchor);
  points.push(anchor);

  var triangle = new Two.Path(points, true);
  triangle.noStroke().fill = 'rgb(0, 102, 0)';
  triangle.rotation = Math.PI;
  tree.add(triangle);

  var stump = new Two.Rectangle(-treeWidth / 2,
                               stumpHeight / 2 - 1,
                               stumpWidth,
                               stumpHeight);
  stump.noStroke().fill = 'rgb(102, 51, 0)';
  tree.add(stump);

  var star = new Two.Star(-treeWidth/2, -treeHeight, 20, 70, 7);
  star.noStroke().fill = 'rgb(255, 230, 0)';
  tree.add(star);

  var presX = -3 * treeWidth / 4 - 10;
  var presY = stumpHeight / 2 + 5;
  var presW = stumpHeight - 5;
  var presH = stumpHeight - 5
  var present = new Two.Rectangle(presX, presY, presW, presH);
  present.noStroke().fill = 'rgb(255, 0, 0)';
  present.linewidth = 5;
  tree.add(present);

  var ribbon = new Two.Rectangle(presX, presY, presW / 5, presH);
  ribbon.noStroke().fill = 'rgb(255, 255, 0)';
  tree.add(ribbon);
  return [tree, triangle, present];
}

$(function() {

  var two = new Two({
    fullscreen: true,
    autostart: true
  }).appendTo(document.body);

  let treeWidth = two.width / 5;
  let treeHeight = two.height / 2;
  let stumpWidth = treeWidth / 6;
  let stumpHeight = treeHeight / 5;
  var tup = buildTree(treeWidth, treeHeight, stumpWidth, stumpHeight);
  var tree = tup[0];
  var triangle = tup[1];
  var present = tup[2];
  tree.translation.set(two.width / 2 + 100, two.height - stumpHeight);
  two.scene.add(tree);

  var circles = [];
  var colors = ['rgb(0, 153, 51)', 'rgb(153, 0, 0)', 'rgb(128, 128, 0)', 'rgb(0, 0, 153)', 'rgb(153, 0, 153)'];
  var lightColors = ['rgb(77, 255, 136)', 'rgb(255, 51, 51)', 'rgb(255, 255, 51)', 'rgb(0, 255, 255)', 'rgb(255, 102, 255)'];
  var numCircles = 15;
  var numCirclesInTree = 0;
  var curDragging = null;
  var circleWidth = 15;
  var gravity = 0.2;
  var drag = 0.6;
  for (var i = 0; i < numCircles; i++) {
    let circle = two.makeCircle(Math.floor(Math.random() * two.width),
                            Math.floor(Math.random() * two.height),
                            circleWidth);
    let colorIndex = Math.floor(Math.random() * colors.length);
    circle.noStroke().fill = colors[colorIndex];
    circle.lightColor = lightColors[colorIndex];
    circle.darkColor = colors[colorIndex];
    circle.isInTree = false;
    circle.dx = 0;
    circle.dy = 0;
    circle.ddx = 0;
    circle.ddy = gravity;
    circles.push(circle);
  }
  // Update the renderer in order to generate corresponding DOM Elements.
  two.update();

  $(present._renderer.elem)
    .click(function(e) {
      if (numCirclesInTree == numCircles) {
        window.location = "https://www.disneyplus.com/home";
      }
    });

  for (var i = 0; i < numCircles; i++) {
    let thisCircle = circles[i];
    $(circles[i]._renderer.elem)
      .css('cursor', 'pointer')
      .click(function(e) {
      })
      .mousedown(function(e) {
        curDragging = thisCircle;
        thisCircle.ddx = 0;
        thisCircle.ddy = 0;
        thisCircle.dx = 0;
        thisCircle.dy = 0;
      })
      .mouseup(function(e) {
        console.log("CIRCLE UP");
        let allEls = document.elementsFromPoint(e.clientX, e.clientY);
        let isInTree = false;
        for (let i = 0; i < allEls.length; i++) {
          if (allEls[i] == triangle._renderer.elem) {
            isInTree = true;
          }
        }
        if (isInTree && !thisCircle.isInTree) {
          thisCircle.fill = thisCircle.lightColor;
          thisCircle.isInTree = true;
          thisCircle.ddx = 0;
          thisCircle.ddy = 0;
          thisCircle.dx = 0;
          thisCircle.dy = 0;
          numCirclesInTree++;
        } else if (!isInTree && thisCircle.isInTree) {
          thisCircle.fill = thisCircle.darkColor;
          thisCircle.isInTree = false;
          numCirclesInTree--;
        }
        if (!isInTree) {
          thisCircle.ddy = gravity;
        }
        if (numCirclesInTree == numCircles) {
          present.stroke = 'rgb(102, 255, 51)';
          present._renderer.elem.style.cursor = 'pointer';
          var text = new Two.Text("Merry Christmas!", two.width / 2, two.height / 4);
          text.fill = 'rgb(0, 0, 0)';
          text.size = 48;
          two.scene.add(text);
        }
        curDragging = null;
      });
  }


  two.on('update', function(frameCount, timeDelta) {
    for (let i = 0; i < numCircles; i++) {
      if (circles[i].isInTree) {
        continue;
      }
      let isOnGround = circles[i].translation.y >= two.height - circleWidth;
      let isNearGround = circles[i].translation.y >= two.height - circleWidth - 10;
      if (isOnGround) {
        circles[i].dy = -circles[i].dy;
        circles[i].dx *= drag;
        circles[i].dy *= drag;
        if (Math.abs(circles[i].dy) < 1) circles[i].dy = 0;
      }
      let newX = circles[i].translation.x + circles[i].dx;
      let newY = Math.min(two.height - circleWidth, circles[i].translation.y + circles[i].dy);
      circles[i].translation.set(newX, newY);
      if (!isOnGround) {
        circles[i].dx += circles[i].ddx;
        circles[i].dy += circles[i].ddy;
      }
    }
  });
  $(window)
    .on('mousemove', function(e) {
      if (curDragging != null) {
        var vec = new Two.Vector(e.clientX, e.clientY);
        curDragging.translation = vec;
      }
    });

  function getRandomColor() {
    return 'rgb('
      + Math.floor(Math.random() * 255) + ','
      + Math.floor(Math.random() * 255) + ','
      + Math.floor(Math.random() * 255) + ')';
  }

});

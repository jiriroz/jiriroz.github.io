$(function() {

  var stats = new Stats();
  var two, particles = [], radius = 50, shouldAdd = false, shouldRemove = false;
  var activeOperations = (url.operations || 'translation').split(',');
  var activeShapes = (url.shapes || 'circle').split(',');
  var colors = [
    'rgb(255, 64, 64)', 'rgb(255, 128, 0)', 'rgb(0, 200, 255)',
    'rgb(0, 191, 168)', 'rgb(153, 102, 255)', 'rgb(255, 244, 95)'
  ];
  var vertices = 0;
  var flags = [
    '_flagMatrix',
    '_flagScale',
    '_flagVertices',
    '_flagFill',
    '_flagStroke',
    '_flagLinewidth',
    '_flagOpacity',
    '_flagVisible',
    '_flagCap',
    '_flagJoin',
    '_flagMiter'
  ];
  var shapes = {
    triangle: {
      enabled: false,
      make: function() {
        var points = generate(3);
        var poly = new Two.Path(points, true);
        return poly;
      }
    },
    circle: {
      enabled: false,
      make: function() {
        var points = generate(8);
        var poly = new Two.Path(points, true, true);
        return poly;
      }
    },
    square: {
      enabled: false,
      make: function() {
        var points = generate(4);
        var poly = new Two.Path(points, true);
        return poly;
      }
    },
    pentagon: {
      enabled: false,
      make: function() {
        var points = generate(5);
        var poly = new Two.Path(points, true);
        return poly;
      }
    },
    star: {
      enabled: false,
      make: function() {
        var r = Math.random() * radius + radius / 2;
        var r2 = r / 2;
        var points = [];
        for (var i = 0; i < 10; i++) {
          var pct = i / 10;
          var angle = pct * Math.PI * 2;
          var x = (i % 2 ? r : r2) * Math.cos(angle);
          var y = (i % 2 ? r : r2) * Math.sin(angle);
          var anchor = new Two.Anchor(x, y);
          anchor.origin = new Two.Vector().copy(anchor);
          vertices++;
          points.push(anchor);
        }
        var poly = new Two.Path(points, true);
        return poly;
      }
    }
  };
  var operations = {
    translation: {
      enabled: false,
      update: function(particle) {

        var w = particle.scale * particle.rect.width / 2;
        var h = particle.scale * particle.rect.height / 2;

        particle.translation.addSelf(particle.velocity)

        if ((particle.translation.x < w && particle.velocity.x < 0)
          || (particle.translation.x > two.width - w && particle.velocity.x > 0)) {
          particle.velocity.x *= -1;
        }

        if ((particle.translation.y < h && particle.velocity.y < 0)
          || (particle.translation.y > two.height - h && particle.velocity.y > 0)) {
          particle.velocity.y *= -1;
        }

      }
    },
    rotation: {
      enabled: false,
      update: function(particle) {
        particle.rotation += particle.velocity.rotation;
      }
    },
    scale: {
      enabled: false,
      update: function(particle) {
        particle.scale = particle.velocity.scale * Math.sin(particle.velocity.phase % Math.PI) + 0.5;
        particle.velocity.phase += particle.velocity.frequency;
      }
    },
    vertices: {
      enabled: false,
      update: function(particle) {
        particle.vertices.forEach(function(anchor) {
          anchor.x = anchor.origin.x + Math.random() * 10 - 5;
          anchor.y = anchor.origin.y + Math.random() * 10 - 5;
        });
      }
    }
  };

  var $window = $(window);
  var $stage = $('#stage');

  $('.title').each(function(i, el) {
    $(el).click(function() {
      $(this).parent().parent().toggleClass('active');
    });
  });

  $('.item').each(function(i, el) {

    var type = $(el).click(function() {
      switch (type) {
        case 'select':
          $(this).parent().find('.enabled').each(function(i, el) {
            $(el).removeClass('enabled');
          });
          $(this).addClass('enabled');
          break;
        case 'checkbox':
          $(this).toggleClass('enabled');
          break;
      }
      $window.trigger($(el).attr('name'));
    }).parent().attr('class');

  });

  var removeAdding = function() {
    $('#particle-count .plus').removeClass('enabled');
    shouldAdd = false;
    updateQueryArgs();
    $window.unbind('mouseup', removeAdding);
  };

  var removeSubtracting = function() {
    $('#particle-count .minus').removeClass('enabled');
    shouldRemove = false;
    updateQueryArgs();
    $window.unbind('mouseup', removeSubtracting);
  };

  var $verticesCount = $('li.count [name=vertices] span');
  var $particleCount = $('#particle-count .plus')
    .bind('mousedown touchstart', function() {
      shouldAdd = true;
      $(this).addClass('enabled');
      $window.bind('mouseup', removeAdding);
    })
    .siblings('.minus')
    .bind('mousedown touchstart', function() {
      shouldRemove = true;
      $(this).addClass('enabled');
      $window.bind('mouseup', removeSubtracting);
    })
    .siblings('span');

  $stage
    .bind('mouseup touchend', function() {

      $('.active').each(function(i, el) {
        $(el).removeClass('active');
      });

    });

  $window
    .bind('resize', function() {

      if (!two) {
        return;
      }

      two.renderer.setSize($window.width(), $window.height());
      two.width = two.renderer.width;
      two.height = two.renderer.height;

    })
    .bind('translation rotation scale vertices', function(e) {

      operations[e.type].enabled = !operations[e.type].enabled;
      if (operations[e.type].enabled) {
        activeOperations.push(e.type);
      } else {
        var index = activeOperations.indexOf(e.type);
        if (index >= 0) {
          activeOperations.splice(index, 1);
        }
      }

      updateQueryArgs();

    })
    .bind('triangle circle square pentagon star', function(e) {

      shapes[e.type].enabled = !shapes[e.type].enabled;
      if (shapes[e.type].enabled) {
        activeShapes.push(e.type);
      } else {
        var index = activeShapes.indexOf(e.type);
        if (index >= 0) {
          activeShapes.splice(index, 1);
        }
      }

      updateQueryArgs();

    })
    .bind('svg canvas webgl', function(e) {

      initializeStage(e.type);

      updateQueryArgs();

    });

  // Setup Stage on page load
  (function() {

    activeOperations.forEach(function(type) {
      operations[type].enabled = true;
      $('[name=' + type + ']').addClass('enabled');
    });

    activeShapes.forEach(function(type) {
      shapes[type].enabled = true;
      $('[name=' + type + ']').addClass('enabled');
    });

    var type = /(canvas|webgl)/.test(url.type) ? url.type : 'svg';
    initializeStage(type);
    $('[name=' + type + ']').addClass('enabled');

    var particleCount = url.int('count', 1);
    for (var i = 0; i < particleCount; i++) {
      addParticle();
    }

  })();

  function initializeStage(type) {

    stats.exists = url.boolean('stats');

    if (stats.exists) {
      document.body.appendChild(stats.domElement);
      var statsStyle = stats.domElement.style;
      statsStyle.position = 'absolute';
      statsStyle.left = 0;
      statsStyle.bottom = 0;
    }

    if (type === 'webgl' && !has.webgl) {
      alert('Yikes! This browser does not support WebGL.');
      return;
    }

    // Remove any previous instances
    Two.Instances.forEach(function(two) {
      Two.Utils.release(two);
      $(two.renderer.domElement).remove();
    });

    Two.Instances.length = 0;

    // Create a new instance
    two = new Two({
      type: Two.Types[type],
      autostart: true
    }).appendTo($stage[0]);

    // Setup the size
    var style = two.renderer.domElement.style;
    style.position = 'absolute';
    style.top = 0;
    style.left = 0;
    style.right = 0;
    style.bottom = 0;

    $window.resize();

    // Reset flags and private variables
    particles.forEach(function(particle) {

      // TODO: figure out what this code did in earlier versions of Two.js. Right now it's broken.
      // particle._renderer = { type: particle._renderer.type };

      flags.forEach(function(flag) {

        if (typeof particle[flag] === 'undefined') {
          return;
        }

        particle[flag] = true;

      });

    });

    two.bind('update', update).scene.add(particles);

  }

  function addParticle() {

    var shape = activeShapes[Math.floor(Math.random() * activeShapes.length)];
    var particle = shapes[shape].make();

    particle.velocity = new Two.Vector(Math.random() * 10, Math.random() * 10);
    particle.velocity.rotation = Math.random() * Math.PI  / 8;
    particle.velocity.scale = Math.random() * 2;
    particle.velocity.phase = 0;
    particle.velocity.frequency = Math.random() * Math.PI / 32;
    particle.rect = particle.getBoundingClientRect();
    if (two) {
      particle.translation.set(two.width / 2, two.height / 2);
    } else {
      particle.translation.set($window.width() / 2, $window.height() / 2);
    }

    particle.fill = colors[Math.floor(Math.random() * colors.length)];
    particle.linewidth = 3;
    particle.stroke = '#fff';

    if (two) {
      two.scene.add(particle);
    }
    particles.push(particle);

    $particleCount.html(particles.length);
    $verticesCount.html(vertices);

  }

  function removeParticle() {

    if (particles.length <= 0) {
      return;
    }

    var particle = particles.pop();
    particle.remove();
    Two.Utils.release(particle);

    vertices -= particle.vertices.length;

    $particleCount.html(particles.length);
    $verticesCount.html(vertices);

  }

  function update() {

    if (stats.exists) {
      stats.update();
    }

    if (shouldAdd) {
      addParticle();
    }

    if (shouldRemove) {
      removeParticle();
    }

    particles.forEach(function(particle) {

      for (var i in operations) {
        if (Object.prototype.hasOwnProperty.call(operations, i)) {
          if (operations[i].enabled) {
            operations[i].update(particle);
          }
        }
      }

    });

  }

  function generate(amount) {
    var r = Math.random() * radius + radius / 2;
    var points = [];
    for (var i = 0; i < amount; i++) {
      var pct = i / amount;
      var angle = pct * Math.PI * 2;
      var x = r * Math.cos(angle);
      var y = r * Math.sin(angle);
      var anchor = new Two.Anchor(x, y);
      anchor.origin = new Two.Vector().copy(anchor);
      vertices++;
      points.push(anchor);
    }
    return points;
  }

  var TTRL = {
    SVGRenderer: 'svg',
    CanvasRenderer: 'canvas',
    WebGLRenderer: 'webgl'
  };

  function updateQueryArgs() {

    var url = './particle-sandbox.html?type=' + TTRL[two.type];

    if (stats.exists) {
      url += '&stats=true';
    }

    if (activeShapes.length > 0) {

      url += '&shapes=' + activeShapes.join(',');

    }

    if (activeOperations.length > 0) {

      url += '&operations=' + activeOperations.join(',');

    }

    url += '&count=' + particles.length;

    if (window.history && window.history.pushState) {
      window.history.pushState({ path: url }, '', url);
    }

  }

});

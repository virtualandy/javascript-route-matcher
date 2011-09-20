module("basics");

test("called with url", function() {
  same(routeMatcher("users", "foo"), null, "shouldn't match");
  same(routeMatcher("users", "users"), {}, "should match");
});

test("called without url", function() {
  var r = routeMatcher("users");
  same(r.parse("foo"), null, "shouldn't match");
  same(r.parse("users"), {}, "should match");
});

module("#parse");

test("regex route", function() {
  var r = routeMatcher(/^users?(?:\/(\d+)(?:\.\.(\d+))?)?/);
  same(r.parse("foo"), null, "shouldn't match");
  same(r.parse("user"), ["user", undefined, undefined], "should match");
  same(r.parse("user/123"), ["user/123", "123", undefined], "should match");
  same(r.parse("user/123..456"), ["user/123..456", "123", "456"], "should match");
});

test("string route, basic", function() {
  var r = routeMatcher("users");
  same(r.parse("fail"), null, "shouldn't match");
  same(r.parse("users/"), null, "shouldn't match");
  same(r.parse("users/foo"), null, "shouldn't match");
  same(r.parse("users"), {}, "Should match");
});

test("string route, one variable", function() {
  var r = routeMatcher("users/:id");
  same(r.parse("users"), null, "shouldn't match");
  same(r.parse("users/123/456"), null, "shouldn't match");
  same(r.parse("users/"), {id: ""}, "should match");
  same(r.parse("users/123"), {id: "123"}, "should match");
});

test("string route, multiple variables", function() {
  var r = routeMatcher("users/:id/:other");
  same(r.parse("users"), null, "shouldn't match");
  same(r.parse("users/123"), null, "shouldn't match");
  same(r.parse("users/123/456"), {id: "123", other: "456"}, "should match");
});

test("string route, one splat", function() {
  var r = routeMatcher("users/*stuff");
  same(r.parse("users"), null, "shouldn't match");
  same(r.parse("users/"), {stuff: ""}, "should match");
  same(r.parse("users/123"), {stuff: "123"}, "should match");
  same(r.parse("users/123/456"), {stuff: "123/456"}, "should match");
});

test("string route, multiple splats", function() {
  var r = routeMatcher("users/*stuff/*more");
  same(r.parse("users"), null, "shouldn't match");
  same(r.parse("users/123"), null, "shouldn't match");
  same(r.parse("users/123/"), {stuff: "123", more: ""}, "should match");
  same(r.parse("users//123"), {stuff: "", more: "123"}, "should match");
  same(r.parse("users//"), {stuff: "", more: ""}, "should match");
  same(r.parse("users///123"), {stuff: "/", more: "123"}, "should match");
  same(r.parse("users/123/456"), {stuff: "123", more: "456"}, "should match");
  same(r.parse("users/123/456/789"), {stuff: "123/456", more: "789"}, "capturing should be greedy");
});

test("string route, variables and splats", function() {
  var r = routeMatcher("users/:id/*stuff/:other/*more");
  same(r.parse("users/123/aaa/456/bbb"), {id: "123", other: "456", stuff: "aaa", more: "bbb"}, "this is pushing it");

  r = routeMatcher("users/:id/:other/*stuff/*more");
  same(r.parse("users/123/456/aaa/bbb/ccc"), {id: "123", other: "456", stuff: "aaa/bbb", more: "ccc"}, "this is a little more reasonable");
});

// These were pulled from the backbone.js unit tests.
test("a few backbone.js test routes", function() {
  var r = routeMatcher("search/:query/p:page");
  same(r.parse("search/boston/p20"), {query: "boston", page: "20"}, "should match");

  r = routeMatcher("*first/complex-:part/*rest");
  same(r.parse("one/two/three/complex-part/four/five/six/seven"), {first: "one/two/three", part: "part", rest: "four/five/six/seven"}, "should match");

  r = routeMatcher(":entity?*args");
  same(r.parse("cowboy?a=b&c=d"), {entity: "cowboy", args: "a=b&c=d"}, "should match");

  r = routeMatcher("*anything");
  same(r.parse("doesnt-match-a-route"), {anything: "doesnt-match-a-route"}, "should match");
});

module("#stringify");

test("regex route", function() {
  var r = routeMatcher(/^users?(?:\/(\d+)(?:\.\.(\d+))?)?/);
  same(r.stringify("anything"), "", "always returns empty string if RegExp route");
});

test("one variable", function() {
  var r = routeMatcher("users/:id");
  same(r.stringify({id: "123"}), "users/123", "should build");
  same(r.stringify({id: ""}), "users/", "should build");
  same(r.stringify({}), "users/", "omitted params default to empty string");
  same(r.stringify(), "users/", "omitted argument default to behave like empty object passed");
});

test("multiple variables", function() {
  var r = routeMatcher("users/:id/:other");
  same(r.stringify({id: "123", other: "456"}), "users/123/456", "should build");
  same(r.stringify({id: "", other: "456"}), "users//456", "should build");
  same(r.stringify({id: "123", other: ""}), "users/123/", "should build");
  same(r.stringify({id: "", other: ""}), "users//", "should build");
  same(r.stringify({id: "123"}), "users/123/", "omitted params default to empty string");
  same(r.stringify({other: "456"}), "users//456", "omitted params default to empty string");
  same(r.stringify({}), "users//", "omitted params default to empty string");
  same(r.stringify(), "users//", "omitted params default to empty string");
});

test("one splat", function() {
  var r = routeMatcher("users/*stuff");
  same(r.stringify({stuff: ""}), "users/", "should build");
  same(r.stringify({stuff: "123"}), "users/123", "should build");
  same(r.stringify({stuff: "123/456"}), "users/123/456", "should build");
  same(r.stringify({}), "users/", "omitted params default to empty string");
  same(r.stringify(), "users/", "omitted params default to empty string");
});

test("multiple splats", function() {
  var r = routeMatcher("users/*stuff/*more");
  same(r.stringify({stuff: "123", more: "456"}), "users/123/456", "should build");
  same(r.stringify({stuff: "123", more: ""}), "users/123/", "should build");
  same(r.stringify({stuff: "", more: "123"}), "users//123", "should build");
  same(r.stringify({stuff: "", more: ""}), "users//", "should build");
  same(r.stringify({}), "users//", "omitted params default to empty string");
  same(r.stringify(), "users//", "omitted params default to empty string");
});

test("possibly conflicting param names", function() {
  var r = routeMatcher(":a/:aa/*aaa/*aaaa");
  same(r.stringify({a: 1, aa: 2, aaa: 3, aaaa: 4}), "1/2/3/4", "should build");
  same(r.stringify({aaaa: 4, aaa: 3, aa: 2, a: 1}), "1/2/3/4", "should build");
});

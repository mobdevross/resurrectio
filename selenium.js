// ---------------------------------------------------------------------------
// SeleniumRender -- a class to render recorded tests to a CasperJS
// test format.
// ---------------------------------------------------------------------------

if (typeof(EventTypes) == "undefined") {
    EventTypes = {};
}

EventTypes.OpenUrl = 0;
EventTypes.Click = 1;
EventTypes.Change = 2;
EventTypes.Comment = 3;
EventTypes.Submit = 4;
EventTypes.CheckPageTitle = 5;
EventTypes.CheckPageLocation = 6;
EventTypes.CheckTextPresent = 7;
EventTypes.CheckValue = 8;
EventTypes.CheckValueContains = 9;
EventTypes.CheckText = 10;
EventTypes.CheckHref = 11;
EventTypes.CheckEnabled = 12;
EventTypes.CheckDisabled = 13;
EventTypes.CheckSelectValue = 14;
EventTypes.CheckSelectOptions = 15;
EventTypes.CheckImageSrc = 16;
EventTypes.PageLoad = 17;
EventTypes.ScreenShot = 18;
EventTypes.MouseDown = 19;
EventTypes.MouseUp = 20;
EventTypes.MouseDrag = 21;
EventTypes.MouseDrop = 22;
EventTypes.KeyPress = 23;

function SeleniumRender(document) {
    this.document = document;
    this.title = "Testcase";
    this.items = null;
    this.history = new Array();
    this.last_events = new Array();
    this.screen_id = 1;
    this.unamed_element_id = 1;
}

SeleniumRender.prototype.text = function(txt) {
    // todo: long lines
    //this.document.writeln(txt);
    $('#code').append(txt + "\n");
}

SeleniumRender.prototype.stmt = function(text) {
    $('input').append(text + "\n");
}

SeleniumRender.prototype.cont = function(text) {
    //this.document.writeln("    ... " + text);
}

SeleniumRender.prototype.pyout = function(text) {
    //this.document.writeln("    " + text);
}

SeleniumRender.prototype.pyrepr = function(text) {
    // todo: handle non--strings & quoting
    return "'" + text + "'";
}

SeleniumRender.prototype.space = function() {
    //this.document.write("\n");
}

var d = {};
d[EventTypes.OpenUrl] = "openUrl";
d[EventTypes.Click] = "click";
//d[EventTypes.Change] = "change";
d[EventTypes.Comment] = "comment";
d[EventTypes.Submit] = "submit";
d[EventTypes.CheckPageTitle] = "checkPageTitle";
d[EventTypes.CheckPageLocation] = "checkPageLocation";
d[EventTypes.CheckTextPresent] = "checkTextPresent";
d[EventTypes.CheckValue] = "checkValue";
d[EventTypes.CheckText] = "checkText";
d[EventTypes.CheckHref] = "checkHref";
d[EventTypes.CheckEnabled] = "checkEnabled";
d[EventTypes.CheckDisabled] = "checkDisabled";
d[EventTypes.CheckSelectValue] = "checkSelectValue";
d[EventTypes.CheckSelectOptions] = "checkSelectOptions";
d[EventTypes.CheckImageSrc] = "checkImageSrc";
d[EventTypes.PageLoad] = "pageLoad";
d[EventTypes.ScreenShot] = "screenShot";
/*d[EventTypes.MouseDown] = "mousedown";
 d[EventTypes.MouseUp] = "mouseup"; */
d[EventTypes.MouseDrag] = "mousedrag";
d[EventTypes.KeyPress] = "keypress";

SeleniumRender.prototype.dispatch = d;

var cc = EventTypes;

SeleniumRender.prototype.render = function(with_xy) {
    this.with_xy = with_xy;
    var etypes = EventTypes;
    //this.document.open();
    //this.document.write("<" + "pre" + ">");
    this.writeHeader();
    var last_down = null;
    var forget_click = false;

    for (var i=0; i < this.items.length; i++) {
        var item = this.items[i];
        if (item.type == etypes.Comment)
            this.space();

        if(i==0) {
            if(item.type!=etypes.OpenUrl) {
                this.text("ERROR: the recorded sequence does not start with a url openning.");
            } else {
                this.startUrl(item);
                continue;
            }
        }

        // remember last MouseDown to identify drag
        if(item.type==etypes.MouseDown) {
            last_down = this.items[i];
            continue;
        }
        if(item.type==etypes.MouseUp && last_down) {
            if(last_down.x == item.x && last_down.y == item.y) {
                console.log(i);
                forget_click = false;
                continue;
            } else {
                item.before = last_down;
                this[this.dispatch[etypes.MouseDrag]](item);
                last_down = null;
                forget_click = true;
                continue;
            }
        }
        if(item.type==etypes.Click && forget_click) {
            forget_click = false;
            continue;
        }

        // we do not want click due to user checking actions
        if(i>0 && item.type==etypes.Click &&
            ((this.items[i-1].type>=etypes.CheckPageTitle && this.items[i-1].type<=etypes.CheckImageSrc) || this.items[i-1].type==etypes.ScreenShot)) {
            continue;
        }

        if (this.dispatch[item.type]) {
            console.log(this.dispatch[item.type]);
            this[this.dispatch[item.type]](item);
        }
        if (item.type == etypes.Comment)
            this.space();
    }
    this.writeFooter();
    //this.document.write("<" + "/" + "pre" + ">");
    //this.document.close();
}

SeleniumRender.prototype.writeHeader = function() {
    this.text("&lt;?php");
    this.text("require_once 'vendor/autoload.php';");
    this.text("class WebDriverDemo extends Sauce\\Sausage\\WebDriverTestCase");
    this.text("{");
    this.text("public static $browsers = array(");
    this.text("array(");
    this.text("'browserName' => 'chrome',");
    this.text("'local' => true,");
    this.text("'sessionStrategy' => 'shared'");
    this.text(")");
    this.text(");");
}
SeleniumRender.prototype.writeFooter = function() {
    this.text("}"); //End Test Function
    this.text("};"); //End PHP Class
    this.text("?&gt;"); //End PHP
}
SeleniumRender.prototype.rewriteUrl = function(url) {
    return url;
}

SeleniumRender.prototype.shortUrl = function(url) {
    return url.substr(url.indexOf('/', 10), 999999999);
}

SeleniumRender.prototype.startUrl = function(item) {

    var currentTime =  new Date().getTime();

    var url = this.pyrepr(this.rewriteUrl(item.url));
    this.text("public function setUpPage()");
    this.text("{");
    this.text("$this->url(" + url + ");");
    this.text("}");
    this.text("public function testAutoGenerated" + currentTime +  "(){");
    this.text("$driver = $this;");  //Used in our Anonymous closures.
}

SeleniumRender.prototype.openUrl = function(item) {
//    var url = this.pyrepr(this.rewriteUrl(item.url));
//    var history = this.history;
//    // if the user apparently hit the back button, foo the event as such
//    if (url == history[history.length - 2]) {
//        this.stmt('casper.then(function() {');
//        this.stmt('    this.back();');
//        this.stmt('});');
//        history.pop();
//        history.pop();
//    } else {
//        this.stmt("casper.thenOpen(" + url + ");");
//    }
}

SeleniumRender.prototype.pageLoad = function(item) {
    var url = this.pyrepr(this.rewriteUrl(item.url));
    this.history.push(url);
}

SeleniumRender.prototype.normalizeWhitespace = function(s) {
    return s.replace(/^\s*/, '').replace(/\s*$/, '').replace(/\s+/g, ' ');
}

SeleniumRender.prototype.getControl = function(item) {
    var type = item.info.type;
    var tag = item.info.tagName.toLowerCase();
    var selector;
    if ((type == "submit" || type == "button") && item.info.value)
        selector = tag+'[type='+type+'][value='+this.pyrepr(this.normalizeWhitespace(item.info.value))+']';
    else if (item.info.name)
        selector = tag+'[name='+this.pyrepr(item.info.name)+']';
    else if (item.info.id)
        selector = tag+'#'+item.info.id;
    else
        selector = item.info.selector;

    return selector;
}

SeleniumRender.prototype.getControlXPath = function(item) {
    var type = item.info.type;
    var way;
    if ((type == "submit" || type == "button") && item.info.value)
        way = '@value=' + this.pyrepr(this.normalizeWhitespace(item.info.value));
    else if (item.info.name)
        way = '@name=' + this.pyrepr(item.info.name);
    else if (item.info.id)
        way = '@id=' + this.pyrepr(item.info.id);
    else
        way = 'TODO';

    return way;
}

SeleniumRender.prototype.getLinkXPath = function(item) {
    var way;
    if (item.text)
        way = 'normalize-space(text())=' + this.pyrepr(this.normalizeWhitespace(item.text));
    else if (item.info.id)
        way = '@id=' + this.pyrepr(item.info.id);
    else if (item.info.href)
        way = '@href=' + this.pyrepr(this.shortUrl(item.info.href));
    else if (item.info.title)
        way = 'title='+this.pyrepr(this.normalizeWhitespace(item.info.title));

    return way;
}

SeleniumRender.prototype.mousedrag = function(item) {
//    if(this.with_xy) {
//        this.stmt('casper.then(function() {');
//        this.stmt('    this.mouse.down('+ item.before.x + ', '+ item.before.y +');');
//        this.stmt('    this.mouse.move('+ item.x + ', '+ item.y +');');
//        this.stmt('    this.mouse.up('+ item.x + ', '+ item.y +');');
//        this.stmt('});');
//    }
}
SeleniumRender.prototype.click = function(item) {
//    var tag = item.info.tagName.toLowerCase();
//    if(this.with_xy && !(tag == 'a' || tag == 'input' || tag == 'button')) {
//        this.stmt('casper.then(function() {');
//        this.stmt('    this.mouse.click('+ item.x + ', '+ item.y +');');
//        this.stmt('});');
//    } else {
//        var selector;
//        if (tag == 'a') {
//            var xpath_selector = this.getLinkXPath(item);
//            if(xpath_selector) {
//                selector = 'x("//a['+xpath_selector+']")';
//            } else {
//                selector = item.info.selector;
//            }
//        } else if (tag == 'input' || tag == 'button') {
//            selector = this.getFormSelector(item) + ' ' + this.getControl(item);
//            selector = '"' + selector + '"';
//        } else {
//            selector = '"' + item.info.selector + '"';
//        }

        var selector = item.info.selector.substr(1);
        this.waitForElement(selector);
        this.text("$this->byId(\"" + selector + "\")->click();");

//        this.text("$link = $this->byId('i am a link');");
//        this.text("$link->click();");

//        this.stmt('casper.waitForSelector('+ selector + ',');
//        this.stmt('    function success() {');
//        this.stmt('        this.test.assertExists('+ selector + ');');
//        this.stmt('        this.click('+ selector + ');');
//        this.stmt('    },');
//        this.stmt('    function fail() {');
//        this.stmt('        this.test.assertExists(' + selector + ');')
//        this.stmt('});');
//    }
}

SeleniumRender.prototype.getFormSelector = function(item) {
    var info = item.info;
    if(!info.form) {
        return 'form';
    }
    if(info.form.name) {
        return "form[name=" + info.form.name + "]";
    } else if(info.form.id) {
        return "form#" + info.form.id;
    } else {
        return "form";
    }
}

SeleniumRender.prototype.keypress = function(item) {
    var text = item.text.replace('\n','').replace('\r', '\\r');
    var selector = item.info.selector.substr(1);
    this.waitForElement(selector);
    this.text("$this->sendKeys($this->byId(\"" + selector + "\"), \"" + text + "\");");
}

SeleniumRender.prototype.submit = function(item) {
    // the submit has been called somehow (user, or script)
    // so no need to trigger it.
    this.stmt("// submit form");
}

SeleniumRender.prototype.screenShot = function(item) {
    // wait 1 second is not the ideal solution, but will be enough most
    // part of time. For slow pages, an assert before capture will make
    // sure evrything is properly loaded before screenshot.
    this.stmt('casper.wait(1000);');
    this.stmt('casper.then(function() {');
    this.stmt('    this.captureSelector("screenshot'+this.screen_id+'.png", "html");');
    this.stmt('});');
    this.screen_id = this.screen_id + 1;
}

SeleniumRender.prototype.comment = function(item) {
    var lines = item.text.split('\n');
    this.stmt('casper.then(function() {');
    for (var i=0; i < lines.length; i++) {
        this.stmt('    this.test.comment("'+lines[i]+'");');
    }
    this.stmt('});');
}

SeleniumRender.prototype.checkPageTitle = function(item) {
    var title = this.pyrepr(item.title);
    this.stmt('casper.then(function() {');
    this.stmt('    this.test.assertTitle('+ title +');');
    this.stmt('});');
}

SeleniumRender.prototype.checkPageLocation = function(item) {
    var url = item.url.replace(new RegExp('/', 'g'), '\\/');
    this.stmt('casper.then(function() {');
    this.stmt('    this.test.assertUrlMatch(/^'+ url +'$/);');
    this.stmt('});');
};

SeleniumRender.prototype.checkTextPresent = function(item) {
    var selector = item.info.selector.substr(1);
    this.waitForElement(selector);
    this.text("$this->assertTextPresent(\"" + item.text +  "\",$this->byId(\""+ selector + "\"));");
};

SeleniumRender.prototype.checkValue = function(item) {
    var type = item.info.type;
    var way = this.getControlXPath(item);
    var selector = '';
    if (type == 'checkbox' || type == 'radio') {
        var selected;
        if (item.info.checked)
            selected = '@checked'
        else
            selected = 'not(@checked)'
        selector = 'x("//input[' + way + ' and ' +selected+ ']")';
    }
    else {
        var value = this.pyrepr(item.info.value)
        var tag = item.info.tagName.toLowerCase();
        selector = 'x("//'+tag+'[' + way + ' and @value='+value+']")';
    }
    this.waitAndTestSelector(selector);
}

SeleniumRender.prototype.checkText = function(item) {
    var selector = '';
    if ((item.info.type == "submit") || (item.info.type == "button")) {
        selector = 'x("//input[@value='+this.pyrepr(item.text)+']")';
    } else {
        selector = 'x("//*[normalize-space(text())='+this.pyrepr(item.text)+']")';
    }

    this.waitForElement(selector);
    this.text("$this->assertTextPresent(\"" + item.text +  "\",$this->byId(\""+ selector + "\"));");
}

SeleniumRender.prototype.checkHref = function(item) {
    var href = this.pyrepr(this.shortUrl(item.info.href));
    var selector = this.getLinkXPath(item);
    if(selector) {
        selector = 'x("//a['+xpath_selector+' and @href='+ href +']")';
    } else {
        selector = item.info.selector+'[href='+ href +']';
    }
    this.stmt('casper.then(function() {');
    this.stmt('    this.test.assertExists('+selector+');');
    this.stmt('});');
}

SeleniumRender.prototype.checkEnabled = function(item) {
    var way = this.getControlXPath(item);
    var tag = item.info.tagName.toLowerCase();
    this.waitAndTestSelector('x("//'+tag+'[' + way + ' and not(@disabled)]")');
}

SeleniumRender.prototype.checkDisabled = function(item) {
    var way = this.getControlXPath(item);
    var tag = item.info.tagName.toLowerCase();
    this.waitAndTestSelector('x("//'+tag+'[' + way + ' and @disabled]")');
}

SeleniumRender.prototype.checkSelectValue = function(item) {
    var value = this.pyrepr(item.info.value);
    var way = this.getControlXPath(item);
    this.waitAndTestSelector('x("//select[' + way + ']/options[@selected and @value='+value+']")');
}

SeleniumRender.prototype.checkSelectOptions = function(item) {
    this.stmt('// TODO');
}

SeleniumRender.prototype.checkImageSrc = function(item) {
    var src = this.pyrepr(this.shortUrl(item.info.src));
    console.log(src);
    this.waitAndTestSelector('x("//img[@src=' + src + ']")');
}


SeleniumRender.prototype.generateFunction = function(selector, functionContent, comment){

    var currentTime =  new Date().getTime();

    this.text("public function testAutoGenerated" + currentTime +  "(){");
    if(typeof comment !== 'undefined'){
        this.text("$comment = " + comment + ";");
    }

    this.text("$element = $this->byXPath(\"" + selector + "\");");

    this.text(functionContent);
    this.text("}");


};

/**
 * Output's a spinAssert function that waits for a specific element to become visible.
 * @param selector
 */
SeleniumRender.prototype.waitForElement = function(selector){
    this.text("$anonymous_Test = function () use ($driver) {");
    this.text("$element = $driver->byId(\""+ selector + "\");");
    this.text("return $element->displayed();");
    this.text("};");
    this.text("$this->spinAssert(\"Expected Element Did not appear in time\", $anonymous_Test, [], 10);");
};

var dt = new SeleniumRender(document);
window.onload = function onpageload() {
    var with_xy = false;
    if(window.location.search=="?xy=true") {
        with_xy = true;
    }

    chrome.extension.sendRequest({action: "get_items"}, function(response) {
        dt.items = response.items;
        //console.log(dt.items.toJSON());
        dt.render(with_xy);
    });

    dt.items = [];
};
Y.ModelForm = Y.Base.create('model-form', Y.Widget, [], {
    initializer: function(cfg) {
        this._fields = [];
        this._eventHandles = [];

        if (cfg.values) { this._formValues = cfg.values; }

        this.set('model', new Y.Model());
        this._eventHandles.push(this.get('model').on('change', this._handleModelChange, this));
    },

    destructor: function() {
        (new Y.EventHandle(this._eventHandles)).detach();
        if (this.form) {
            this.form.destroy();
        }
    },
    
    renderUI: function() {
        if (this.get('markup')) {
            this.get('contentBox').setHTML(Y.Node.create(this.get('markup')));
        }
        this.form = this.get('boundingBox').one('form');
        this._parseFields();
    },

    getField: function(name) {
         return this._fields[name];
    },

    getForm: function() {
        return this.form;
    },

    reset: function(clear) {
        this.get('model').reset();
        if (!clear) {
            if (!Y.Object.isEmpty(this._formValues)) {
                this.get('model').setAttrs(this._formValues);
            }
        }
    },

    _handleModelChange: function(e) {
        if (e.src === 'form') { return; }

        Y.Object.each(e.changed, function(obj, key) {
            var field = this.getField(key);
            if (!Y.Lang.isUndefined(field)) {
                if (field.get('type') === 'checkbox') {
                    field.set('checked', obj.newVal);
                } else if (field.get('type') === 'radio') {
                    Y.all('input[name=' + key + ']').each(function (field) {
                        if (field.get('value') === obj.newVal) {
                            field.set('checked', true);
                        }
                    }, this);
                } else {
                    field.set('value', obj.newVal);
                }
            }

        }, this);
    },

    /* interesting idea ... create a master table ... and do a lookup on nodeName/nodeType then
       pull out and trigger a method reference ... to avoid all of the nested if/else stuff? */
    _parseFields: function() {
        var allFields = this.get('boundingBox').one('form').all('*'),
            model = this.get('model'),
            _formValues = {};

        /* create a table like so
            var nodeTypes = {
                'INPUT': {
                    'text':'_handleTextInput'
                }
            };
            
            use like this ...
            if (nodeTypes[nodeName][nodeType]) {
                var handleMethod = eval(nodeTypes[nodeName][nodeType]);
                handleMethod.apply(node, [fieldName, _formValues]);
            }
        */

        allFields.each(function (node) {
            var nodeName = node.get('nodeName'),
                nodeType = node.get('type'),
                fieldName = node.get('name');
        
            if (nodeName === 'INPUT') {
                if (nodeType === 'text') {
                    this._eventHandles.push(
                        node.after('keyup', function(e) {
                            model.set(fieldName, e.target.get('value'), {src:'form'});
                        }, this)
                    );
                    if (node.get('value') !== '') {
                        _formValues[fieldName] = node.get('value');
                    }
                } else if (nodeType === 'checkbox') {
                    this._eventHandles.push(
                        node.after('click', function(e) {
                            model.set(fieldName, e.target.get('checked'), {src:'form'});
                        }, this)
                    );
                    if (node.get('checked')) {
                        _formValues[fieldName] = node.get('checked');
                    }
                } else if (nodeType === 'radio') {
                    this._eventHandles.push(
                        node.on('change', function(e) {
                            model.set(fieldName, e.target.get('value'), {src:'form'});
                        }, this)
                    );
                    if (node.get('checked')) {
                        _formValues[fieldName] = node.get('value');
                    }
                }
                this._fields[fieldName] = node;
            } else if (nodeName === 'SELECT') {
                /* nodeType is 'select-one' */
                this._eventHandles.push(
                    node.after('change', function(e) {
                        model.set(fieldName, e.target.get('value'), {src:'form'});
                    }, this)
                );
                this._fields[fieldName] = node;
                node.get('options').each(function(option) {
                    if (option.get('selected')) {
                        _formValues[fieldName] = option.get('value');
                    }
                }, this);
            } else if (nodeName === 'TEXTAREA') {
                /* nodeType is 'textarea' */
                this._eventHandles.push(
                    node.on('keyup', function(e) {
                        model.set(fieldName, e.target.get('value'), {src:'form'});
                    })
                );
                this._fields[fieldName] = node;
                if (node.get('value') !== '') {
                    _formValues[fieldName] = node.get('value');
                }
            } else if (nodeName === 'BUTTON') {
                /* nodeType is 'button' */
                this._eventHandles.push(
                    node.on('click', function(e) {
                        model.set(fieldName, e.target.get('value'), {src:'form'});
                    })
                );
                this._fields[fieldName] = node;
                if (node.get('value') !== '') {
                    _formValues[fieldName] = node.get('value');
                }
            }
        }, this);

        Y.Object.each(this._fields, function(field, fieldName) {
            if (!model.get(fieldName)) {
                model.set(fieldName, '', {silent: true});
            }
        });

        /* Do we have form values passed in? */
        if (!Y.Object.isEmpty(this._formValues)) {
            this._formValues = Y.merge(_formValues, this._formValues);
            model.setAttrs(this._formValues);
        }

        /* Y.merge with this._formValues? */
        /*
        if (!Y.Object.isEmpty(formValues)) {
            console.log('formValues:', formValues);
            model.setAttrs(formValues);
        }
        */
    }
},
{
    ATTRS: {
        markup: {
            value: ''
        },
        model: {
            value: null
        }
    }
});

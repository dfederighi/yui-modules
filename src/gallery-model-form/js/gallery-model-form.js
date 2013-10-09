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

    _parseFields: function() {
        var allFields = this.get('boundingBox').one('form').all('*'),
            model = this.get('model'),
            formValues = {};
        
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
                } else if (nodeType === 'checkbox') {
                    this._eventHandles.push(
                        node.after('click', function(e) {
                            model.set(fieldName, e.target.get('checked'), {src:'form'});
                        }, this)
                    );
                } else if (nodeType === 'radio') {
                    this._eventHandles.push(
                        node.on('change', function(e) {
                            model.set(fieldName, e.target.get('value'), {src:'form'});
                        }, this)
                    );
                }
                this._fields[fieldName] = node;
                formValues[fieldName] = node.get('value');
            } else if (nodeName === 'SELECT') {
                this._eventHandles.push(
                    node.after('change', function(e) {
                        model.set(fieldName, e.target.get('value'), {src:'form'});
                    }, this)
                );
                this._fields[fieldName] = node;
                formValues[fieldName] = node.get('value');
            } else if (nodeName === 'TEXTAREA') {
                this._eventHandles.push(
                    node.on('keyup', function(e) {
                        model.set(fieldName, e.target.get('value'), {src:'form'});
                    })
                );
                this._fields[fieldName] = node;
                formValues[fieldName] = node.get('value');
            } else if (nodeName === 'BUTTON') {
                this._eventHandles.push(
                    node.on('click', function(e) {
                        model.set(fieldName, e.target.get('value'), {src:'form'});
                    })
                );
                this._fields[fieldName] = node;
                formValues[fieldName] = node.get('value');
            }
        }, this);

        Y.Object.each(this._fields, function(field, fieldName) {
            if (!model.get(fieldName)) {
                model.set(fieldName, '', {silent: true});
            }
        });

        /* Do we have form values passed in? */
        if (!Y.Object.isEmpty(this._formValues)) {
            model.setAttrs(this._formValues);
        } else {
            if (!Y.Object.isEmpty(formValues)) {
                model.setAttrs(formValues);
            }
        }
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

from marionette_driver.marionette import Marionette

class TestHeatmap(object):
    def setup_class(cls):
        self.client = Marionette(host='localhost', port=2828)
        self.client.start_session()

    def teardown_cls(cls):
        pass

    def _new_blanktab(self):
        """
        open a new blank tab and return the current window handle
        """
        self.client.execute_script("window.open('', '_blank');")
        new_handle = self.client.current_window_handle
        return new_handle

    def _bound_navigate(self, new_url):
        """
        When we navigate to a new URL, the heatmap webextension
        will inject two DOM nodes into the page meta data block
        so that we can track pages with window handles.

        This method will bind the two together into a 3-tuple of
        (marionette_window_id, firefox_window_id, firefox_tab_id)
        """

        # Note that the navigate() api is blocking, so we know that
        # the webextensio should have completed modifying the page by
        # the time we get control back
        self.client.navigate(new_url)

        elem = self.client.find_element("moz_heatmap_window_id")
        if elem:
            window_id = int(elem.text)

        elem = self.client.find_element("moz_heatmap_tab_id")
        if elem:
            tab_id = int(elem.text)

        return (self.client.current_window_handle, window_id, tab_id)


    def test_open_newtab_simple_visit(self):
        """
        Open a new tab, go to google.com and then close the tab
        """
        new_handle = self._new_blanktab()
        bound_handle = self._bound_navigate('http://www.google.com')
        assert type(bound_handle[1]) == types.IntType
        assert type(bound_handle[2]) == types.IntType

    def run_chrome_context(self):
        with client.set_context(client.CONTEXT_CHROME):
            pass

    def run_content_context(self):
        with client.set_context(client.CONTEXT_CONTENT):
            pass
